const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../services/db');
const { sendResetEmail } = require('../services/email');

async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run(name, email, passwordHash);
    const user = db.prepare('SELECT id, name, email, xp, streak FROM users WHERE id = ?').get(result.lastInsertRowid);

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    db.prepare('UPDATE users SET last_login = datetime(\'now\') WHERE id = ?').run(user.id);

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ user: { id: user.id, name: user.name, email: user.email, xp: user.xp, streak: user.streak } });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
}

async function getMe(req, res, next) {
  try {
    const user = db.prepare('SELECT id, name, email, xp, streak, created_at FROM users WHERE id = ?').get(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, resetToken, expiresAt);

    await sendResetEmail(email, resetToken);
    res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and new password are required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const record = db.prepare('SELECT * FROM reset_tokens WHERE token = ?').get(token);
    if (!record || record.used || new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, record.user_id);
    db.prepare('UPDATE reset_tokens SET used = 1 WHERE id = ?').run(record.id);

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, currentPassword, newPassword } = req.body;

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password is required to change password' });
      const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.userId);
      const valid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
      if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
      const hash = await bcrypt.hash(newPassword, 12);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.userId);
    }

    if (name) {
      db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, req.userId);
    }

    const user = db.prepare('SELECT id, name, email, xp, streak FROM users WHERE id = ?').get(req.userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, logout, getMe, forgotPassword, resetPassword, updateProfile };
