const db = require('../services/db');
const { chatCompletion } = require('../services/openai');

function getCourseContext(courseId, userId) {
  const course = db.prepare('SELECT * FROM courses WHERE id = ? AND user_id = ?').get(parseInt(courseId), userId);
  if (!course) throw new Error('Course not found');
  course.videos = db.prepare('SELECT * FROM videos WHERE course_id = ? ORDER BY order_index').all(course.id);
  return course;
}

async function summarizeVideo(req, res, next) {
  try {
    const { courseId, videoId } = req.body;
    const course = getCourseContext(courseId, req.userId);
    const video = course.videos.find(v => v.id === parseInt(videoId));
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const content = video.transcript || video.description || video.title;
    const summary = await chatCompletion([
      { role: 'system', content: 'You are an expert teacher. Create clear, well-structured markdown summaries of educational videos. Include key points, definitions, formulas (using LaTeX notation), and practical examples.' },
      { role: 'user', content: `Summarize this video:\n\nTitle: "${video.title}"\nCourse: "${course.title}"\n\nContent:\n${content.slice(0, 8000)}` }
    ]);

    db.prepare('UPDATE users SET xp = xp + 10 WHERE id = ?').run(req.userId);
    res.json({ summary, videoTitle: video.title });
  } catch (err) { next(err); }
}

async function teachTopic(req, res, next) {
  try {
    const { courseId, topic, followUp } = req.body;
    const course = getCourseContext(courseId, req.userId);
    const courseContext = course.videos.map(v => `"${v.title}": ${(v.transcript || v.description || '').slice(0, 1000)}`).join('\n\n');

    const response = await chatCompletion([
      { role: 'system', content: `You are Nyra, an expert AI tutor using the Socratic method. You are teaching from the course "${course.title}". Explain concepts step by step, use analogies, provide examples, and check understanding. Be encouraging. Use markdown formatting.\nCourse content:\n${courseContext.slice(0, 6000)}` },
      { role: 'user', content: followUp || `Teach me about: ${topic}` }
    ]);

    db.prepare('UPDATE users SET xp = xp + 15 WHERE id = ?').run(req.userId);
    res.json({ response, topic });
  } catch (err) { next(err); }
}

async function findTopic(req, res, next) {
  try {
    const { courseId, query } = req.body;
    const course = getCourseContext(courseId, req.userId);
    const results = [];

    for (const video of course.videos) {
      const text = (video.transcript || video.description || '').toLowerCase();
      const queryLower = query.toLowerCase();
      if (text.includes(queryLower) || video.title.toLowerCase().includes(queryLower)) {
        const idx = Math.max(0, text.indexOf(queryLower));
        const excerpt = (video.transcript || video.description || '').slice(Math.max(0, idx - 100), idx + 300);
        results.push({ videoId: video.id, videoTitle: video.title, youtubeId: video.youtube_id, excerpt: `...${excerpt}...`, relevance: video.title.toLowerCase().includes(queryLower) ? 1.0 : 0.7 });
      }
    }

    if (results.length === 0) {
      try {
        const aiSearch = await chatCompletion([
          { role: 'system', content: 'You are a search engine for educational content. Respond with JSON array only.' },
          { role: 'user', content: `Search for "${query}" in this course:\n${course.videos.map(v => `[${v.id}] "${v.title}": ${(v.transcript || '').slice(0, 500)}`).join('\n')}\n\nRespond with JSON array: [{"videoId": number, "videoTitle": "string", "excerpt": "relevant excerpt", "relevance": 0.0-1.0}]` }
        ]);
        const cleaned = aiSearch.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        results.push(...JSON.parse(cleaned));
      } catch (e) { /* no results */ }
    }

    res.json({ results: results.sort((a, b) => b.relevance - a.relevance), query });
  } catch (err) { next(err); }
}

async function generateMindMap(req, res, next) {
  try {
    const { courseId } = req.body;
    const course = getCourseContext(courseId, req.userId);
    const videoTopics = course.videos.map(v => `"${v.title}"`).join(', ');

    const response = await chatCompletion([
      { role: 'system', content: 'You are a visual learning expert. Generate mind map data as JSON. Respond ONLY with valid JSON, no markdown.' },
      { role: 'user', content: `Create a mind map for "${course.title}" with videos: ${videoTopics}.\n\nGenerate JSON: {"nodes":[{"id":"1","label":"Main Topic","type":"main"},{"id":"2","label":"Subtopic","type":"sub"}],"edges":[{"source":"1","target":"2"}]}\n\nCreate 15-25 nodes covering all major topics.` }
    ]);

    let mindMapData;
    try {
      mindMapData = JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    } catch (e) {
      const nodes = [{ id: '0', label: course.title, type: 'main' }];
      const edges = [];
      course.videos.forEach((v, i) => { nodes.push({ id: String(i + 1), label: v.title, type: 'sub' }); edges.push({ source: '0', target: String(i + 1) }); });
      mindMapData = { nodes, edges };
    }

    db.prepare('UPDATE users SET xp = xp + 20 WHERE id = ?').run(req.userId);
    res.json({ mindMap: mindMapData, courseTitle: course.title });
  } catch (err) { next(err); }
}

async function generateExam(req, res, next) {
  try {
    const { courseId, topics, questionCount = 10 } = req.body;
    const course = getCourseContext(courseId, req.userId);
    const courseContent = course.videos.map(v => `"${v.title}": ${(v.transcript || v.description || '').slice(0, 1500)}`).join('\n\n');
    const topicFilter = topics && topics.length > 0 ? `Focus on: ${topics.join(', ')}` : 'Cover all major topics';

    const response = await chatCompletion([
      { role: 'system', content: 'You are an expert exam creator. Generate challenging but fair questions. Respond ONLY with valid JSON.' },
      { role: 'user', content: `Create exam for "${course.title}". ${topicFilter}.\n\nContent:\n${courseContent.slice(0, 8000)}\n\nGenerate ${questionCount} questions as JSON:\n{"questions":[{"id":1,"type":"mcq","question":"Q","options":["A","B","C","D"],"correctAnswer":"A","explanation":"Why"},{"id":2,"type":"true-false","question":"Statement","correctAnswer":"true","explanation":"Why"},{"id":3,"type":"short-answer","question":"Q","correctAnswer":"Answer","explanation":"Detail"}]}\n\nMix: 60% MCQ, 20% True/False, 20% Short Answer.` }
    ]);

    let examData;
    try {
      examData = JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    } catch (e) {
      return res.status(500).json({ error: 'Failed to generate exam. Please try again.' });
    }

    res.json({ exam: examData, courseTitle: course.title });
  } catch (err) { next(err); }
}

async function submitExam(req, res, next) {
  try {
    const { courseId, questions, answers, score } = req.body;
    const result = db.prepare('INSERT INTO quizzes (user_id, course_id, questions_json, answers_json, score) VALUES (?, ?, ?, ?, ?)').run(
      req.userId, parseInt(courseId), JSON.stringify(questions), JSON.stringify(answers), parseFloat(score)
    );
    const xpEarned = Math.round(score * 50);
    db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?').run(xpEarned, req.userId);
    res.json({ quizId: result.lastInsertRowid, xpEarned });
  } catch (err) { next(err); }
}

async function analyzeGaps(req, res, next) {
  try {
    const { courseId } = req.body;
    const course = getCourseContext(courseId, req.userId);
    const videoTopics = course.videos.map(v => v.title).join('\n- ');

    const response = await chatCompletion([
      { role: 'system', content: 'You are an expert curriculum analyst. Identify knowledge gaps and recommend resources. Respond in well-structured markdown.' },
      { role: 'user', content: `Analyze this course for gaps:\n\nCourse: "${course.title}"\nTopics covered:\n- ${videoTopics}\n\nPlease:\n1. List missing/underrepresented topics\n2. Identify uncovered prerequisites\n3. Suggest free resources for each gap\n4. Rate overall completeness (out of 10)` }
    ]);

    db.prepare('UPDATE users SET xp = xp + 15 WHERE id = ?').run(req.userId);
    res.json({ analysis: response, courseTitle: course.title });
  } catch (err) { next(err); }
}

module.exports = { summarizeVideo, teachTopic, findTopic, generateMindMap, generateExam, submitExam, analyzeGaps };
