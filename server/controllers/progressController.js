const db = require('../services/db');

async function updateProgress(req, res, next) {
  try {
    const { videoId, status } = req.body;
    if (!videoId || !status) return res.status(400).json({ error: 'videoId and status are required' });

    const validStatuses = ['watched', 'in-progress', 'unwatched'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const existing = db.prepare('SELECT id FROM progress WHERE user_id = ? AND video_id = ?').get(req.userId, parseInt(videoId));
    if (existing) {
      db.prepare('UPDATE progress SET status = ?, watched_at = ? WHERE id = ?').run(status, status === 'watched' ? new Date().toISOString() : null, existing.id);
    } else {
      db.prepare('INSERT INTO progress (user_id, video_id, status, watched_at) VALUES (?, ?, ?, ?)').run(req.userId, parseInt(videoId), status, status === 'watched' ? new Date().toISOString() : null);
    }

    if (status === 'watched') {
      db.prepare('UPDATE users SET xp = xp + 5 WHERE id = ?').run(req.userId);
    }

    res.json({ success: true });
  } catch (err) { next(err); }
}

async function getStats(req, res, next) {
  try {
    const user = db.prepare('SELECT xp, streak, created_at FROM users WHERE id = ?').get(req.userId);
    const totalCourses = db.prepare('SELECT COUNT(*) as cnt FROM courses WHERE user_id = ?').get(req.userId).cnt;
    const totalVideos = db.prepare('SELECT COUNT(*) as cnt FROM videos v JOIN courses c ON v.course_id = c.id WHERE c.user_id = ?').get(req.userId).cnt;
    const watchedVideos = db.prepare("SELECT COUNT(*) as cnt FROM progress WHERE user_id = ? AND status = 'watched'").get(req.userId).cnt;
    const quizzes = db.prepare('SELECT score, taken_at FROM quizzes WHERE user_id = ? ORDER BY taken_at DESC LIMIT 20').all(req.userId);
    const avgScore = quizzes.length > 0 ? quizzes.reduce((s, q) => s + q.score, 0) / quizzes.length : 0;

    const achievements = [];
    if (totalCourses >= 1) achievements.push({ id: 'first_course', name: 'First Course', icon: '🎯', description: 'Analyzed your first course' });
    if (watchedVideos >= 10) achievements.push({ id: 'video_10', name: 'Dedicated Learner', icon: '📚', description: 'Watched 10 videos' });
    if (quizzes.length >= 1) achievements.push({ id: 'first_quiz', name: 'Quiz Taker', icon: '✏️', description: 'Completed your first quiz' });
    if (quizzes.length >= 5) achievements.push({ id: 'quiz_master', name: 'Quiz Master', icon: '🏆', description: 'Completed 5 quizzes' });
    if (avgScore >= 80) achievements.push({ id: 'high_scorer', name: 'High Scorer', icon: '⭐', description: 'Average quiz score above 80%' });
    if (user.xp >= 500) achievements.push({ id: 'xp_500', name: 'Knowledge Seeker', icon: '🧠', description: 'Earned 500 XP' });
    if (user.streak >= 7) achievements.push({ id: 'streak_7', name: 'Week Warrior', icon: '🔥', description: '7-day learning streak' });

    res.json({
      stats: {
        xp: user.xp, streak: user.streak, totalCourses, totalVideos, watchedVideos,
        completionRate: totalVideos > 0 ? Math.round((watchedVideos / totalVideos) * 100) : 0,
        quizzesTaken: quizzes.length, avgScore: Math.round(avgScore),
        recentQuizzes: quizzes.slice(0, 5), achievements, memberSince: user.created_at
      }
    });
  } catch (err) { next(err); }
}

module.exports = { updateProgress, getStats };
