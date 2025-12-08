const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { users, nextId } = require('../store');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";


router.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: "username and password required" });

  const existing = users.find(u => u.username === username);
  if (existing) return res.status(409).json({ message: "user exists" });

  const hash = await bcrypt.hash(password, 8);
  const user = { id: nextId(), username, passwordHash: hash };

  users.push(user);
  res.status(201).json({ id: user.id, username });
});


router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ message: "invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "invalid credentials" });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" });

  res.json({ token });
});

module.exports = router;
