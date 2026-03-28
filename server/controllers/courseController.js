const db = require('../services/db');
const { getPlaylistInfo, getVideoTranscript } = require('../services/youtube');
const { chatCompletion } = require('../services/openai');

async function analyzeCourse(req, res, next) {
  try {
    const { playlistUrl } = req.body;
    if (!playlistUrl) return res.status(400).json({ error: 'Playlist URL is required' });

    // Check if already analyzed
    const existing = db.prepare('SELECT * FROM courses WHERE user_id = ? AND playlist_url = ?').get(req.userId, playlistUrl);
    if (existing) {
      existing.videos = db.prepare('SELECT * FROM videos WHERE course_id = ? ORDER BY order_index').all(existing.id);
      return res.json({ course: existing });
    }

    // Fetch playlist info
    const playlistData = await getPlaylistInfo(playlistUrl);

    // Create course record
    const courseResult = db.prepare('INSERT INTO courses (user_id, playlist_url, title, video_count) VALUES (?, ?, ?, ?)').run(
      req.userId, playlistUrl, playlistData.title, playlistData.videos.length
    );
    const courseId = courseResult.lastInsertRowid;

    // Save videos and fetch transcripts
    const insertVideo = db.prepare('INSERT INTO videos (course_id, youtube_id, title, description, transcript, duration, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const videoRecords = [];

    for (let i = 0; i < playlistData.videos.length; i++) {
      const v = playlistData.videos[i];
      let transcript = '';
      try { transcript = await getVideoTranscript(v.youtubeId); } catch (e) { transcript = v.description || ''; }

      const vResult = insertVideo.run(courseId, v.youtubeId, v.title, v.description || '', transcript || v.description || '', String(v.duration || ''), i);
      videoRecords.push({ id: vResult.lastInsertRowid, title: v.title, transcript: transcript || v.description || '' });
    }

    // AI Analysis
    const videoSummaries = videoRecords.map((v, i) => `${i + 1}. "${v.title}" - ${(v.transcript || '').slice(0, 500)}`).join('\n');

    let analysisJson = '{}';
    try {
      const aiResponse = await chatCompletion([
        { role: 'system', content: 'You are an expert educational course analyst. Respond only with valid JSON.' },
        { role: 'user', content: `Analyze this YouTube course and provide a structured JSON response:\n\nCourse: "${playlistData.title}"\nVideos:\n${videoSummaries}\n\nRespond ONLY with valid JSON (no markdown code blocks):\n{"summary":"2-3 paragraph course summary","topics":["topic1","topic2"],"prerequisites":["prereq1"],"difficulty":"beginner|intermediate|advanced","estimatedHours":number,"keyConceptsPerVideo":[{"video":"title","concepts":["c1","c2"]}]}` }
      ]);
      analysisJson = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      JSON.parse(analysisJson); // validate
    } catch (e) {
      analysisJson = JSON.stringify({
        summary: `Course: ${playlistData.title} with ${playlistData.videos.length} videos`,
        topics: playlistData.videos.map(v => v.title),
        prerequisites: [], difficulty: 'intermediate',
        estimatedHours: playlistData.videos.length * 0.25
      });
    }

    db.prepare('UPDATE courses SET analysis_json = ? WHERE id = ?').run(analysisJson, courseId);
    db.prepare('UPDATE users SET xp = xp + 50 WHERE id = ?').run(req.userId);

    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
    course.videos = db.prepare('SELECT * FROM videos WHERE course_id = ? ORDER BY order_index').all(courseId);

    res.json({ course });
  } catch (err) {
    next(err);
  }
}

async function getCourses(req, res, next) {
  try {
    const courses = db.prepare('SELECT * FROM courses WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);

    const result = courses.map(course => {
      const videos = db.prepare('SELECT id, title, youtube_id, duration, order_index FROM videos WHERE course_id = ? ORDER BY order_index').all(course.id);
      const totalVideos = videos.length;
      const watchedCount = totalVideos > 0
        ? db.prepare(`SELECT COUNT(*) as cnt FROM progress WHERE user_id = ? AND video_id IN (${videos.map(v => v.id).join(',') || 0}) AND status = 'watched'`).get(req.userId)?.cnt || 0
        : 0;
      return { ...course, videos, progress: totalVideos > 0 ? Math.round((watchedCount / totalVideos) * 100) : 0 };
    });

    res.json({ courses: result });
  } catch (err) {
    next(err);
  }
}

async function getCourse(req, res, next) {
  try {
    const { id } = req.params;
    const course = db.prepare('SELECT * FROM courses WHERE id = ? AND user_id = ?').get(parseInt(id), req.userId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const videos = db.prepare('SELECT * FROM videos WHERE course_id = ? ORDER BY order_index').all(course.id);
    const progressRows = db.prepare(`SELECT video_id, status FROM progress WHERE user_id = ? AND video_id IN (${videos.map(v => v.id).join(',') || 0})`).all(req.userId);
    const progressMap = {};
    progressRows.forEach(p => { progressMap[p.video_id] = p.status; });

    course.videos = videos.map(v => ({ ...v, status: progressMap[v.id] || 'unwatched' }));
    res.json({ course });
  } catch (err) {
    next(err);
  }
}

async function deleteCourse(req, res, next) {
  try {
    const { id } = req.params;
    const course = db.prepare('SELECT * FROM courses WHERE id = ? AND user_id = ?').get(parseInt(id), req.userId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const videoIds = db.prepare('SELECT id FROM videos WHERE course_id = ?').all(course.id).map(v => v.id);
    if (videoIds.length > 0) {
      db.prepare(`DELETE FROM progress WHERE video_id IN (${videoIds.join(',')})`).run();
    }
    db.prepare('DELETE FROM quizzes WHERE course_id = ?').run(course.id);
    db.prepare('DELETE FROM chats WHERE course_id = ?').run(course.id);
    db.prepare('DELETE FROM videos WHERE course_id = ?').run(course.id);
    db.prepare('DELETE FROM courses WHERE id = ?').run(course.id);

    res.json({ message: 'Course deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { analyzeCourse, getCourses, getCourse, deleteCourse };
