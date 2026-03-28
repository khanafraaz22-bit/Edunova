const db = require('../services/db');
const { chatCompletion } = require('../services/openai');

async function getChat(req, res, next) {
  try {
    const { courseId } = req.params;
    const cid = parseInt(courseId) || null;
    let chat = cid
      ? db.prepare('SELECT * FROM chats WHERE user_id = ? AND course_id = ? ORDER BY created_at DESC LIMIT 1').get(req.userId, cid)
      : db.prepare('SELECT * FROM chats WHERE user_id = ? AND course_id IS NULL ORDER BY created_at DESC LIMIT 1').get(req.userId);

    if (!chat) {
      const result = db.prepare('INSERT INTO chats (user_id, course_id, messages_json) VALUES (?, ?, ?)').run(req.userId, cid, '[]');
      chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(result.lastInsertRowid);
    }
    res.json({ chat: { ...chat, messages: JSON.parse(chat.messages_json) } });
  } catch (err) { next(err); }
}

async function sendMessage(req, res, next) {
  try {
    const { courseId, message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const cid = courseId ? parseInt(courseId) : null;
    let systemMessage;
    let course = null;

    if (cid) {
      course = db.prepare('SELECT * FROM courses WHERE id = ? AND user_id = ?').get(cid, req.userId);
    }

    if (course) {
      const videos = db.prepare('SELECT * FROM videos WHERE course_id = ? ORDER BY order_index').all(course.id);
      const courseContext = videos.map(v => `"${v.title}": ${(v.transcript || v.description || '').slice(0, 600)}`).join('\n');
      systemMessage = `You are Nyra, a brilliant AI study companion for EduNova. You are helping with "${course.title}".\n\nCourse content:\n${courseContext.slice(0, 5000)}\n\nBe helpful, encouraging, and educational. Use markdown formatting. Keep responses focused and clear.`;
    } else {
      systemMessage = `You are Nyra, an advanced AI study companion for EduNova — a futuristic AI learning platform. You help students understand any topic, explain concepts clearly using the Socratic method, and make learning engaging.\n\nYou can:\n- Explain any topic or concept\n- Help students understand difficult material\n- Suggest learning strategies\n- Answer questions about courses or subjects\n\nBe encouraging, precise, and use markdown formatting for clarity.`;
    }

    // Get or create chat record (NULL course_id = general chat)
    let chat = cid
      ? db.prepare('SELECT * FROM chats WHERE user_id = ? AND course_id = ? ORDER BY created_at DESC LIMIT 1').get(req.userId, cid)
      : db.prepare('SELECT * FROM chats WHERE user_id = ? AND course_id IS NULL ORDER BY created_at DESC LIMIT 1').get(req.userId);

    if (!chat) {
      const result = db.prepare('INSERT INTO chats (user_id, course_id, messages_json) VALUES (?, ?, ?)').run(req.userId, cid, '[]');
      chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(result.lastInsertRowid);
    }

    const messages = JSON.parse(chat.messages_json);
    messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });

    const recentMessages = messages.slice(-12).map(m => ({ role: m.role, content: m.content }));
    const aiResponse = await chatCompletion([{ role: 'system', content: systemMessage }, ...recentMessages]);

    messages.push({ role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() });
    db.prepare('UPDATE chats SET messages_json = ? WHERE id = ?').run(JSON.stringify(messages), chat.id);
    db.prepare('UPDATE users SET xp = xp + 2 WHERE id = ?').run(req.userId);

    res.json({ reply: aiResponse, messages });
  } catch (err) { next(err); }
}

module.exports = { getChat, sendMessage };
