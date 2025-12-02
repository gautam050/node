const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const transporter = require('../config/mailer');
const generateResetToken = require('../utils/generateToken');
const User = require('../models/User');
const ResetToken = require('../models/ResetToken');

const RESET_TOKEN_EXPIRY_MIN = Number(process.env.RESET_TOKEN_EXPIRY_MIN || 30);

function signJWT(payload) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
  return jwt.sign(payload, secret, { expiresIn });
}


exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'name, email and password required' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email: email.toLowerCase(), password: hashed });
     const token = signJWT({ id: user._id });
    res.status(201).json({ message: 'User created', token });
  } catch (err) {
    next(err);
  }
};


exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signJWT({ id: user._id });
    res.json({ message: 'Login successful', token });
  } catch (err) {
    next(err);
  }
};


exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email required' });

    const user = await User.findOne({ email: email.toLowerCase() });

    
    const genericSuccess = { message: 'If that email is registered, you will receive a password reset link shortly.' };

    if (!user) {
      return res.json(genericSuccess);
    }

    
    const tokenString = generateResetToken();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MIN * 60 * 1000);

    await ResetToken.create({
      userId: user._id,
      token: tokenString,
      expiresAt,
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${encodeURIComponent(tokenString)}`;

   
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: user.email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click the link to reset (valid for ${RESET_TOKEN_EXPIRY_MIN} minutes):\n\n${resetLink}\n\nIf you did not request this, ignore this email.`,
      html: `<p>You requested a password reset. Click the link below to reset your password (valid for ${RESET_TOKEN_EXPIRY_MIN} minutes):</p>
             <p><a href="${resetLink}">${resetLink}</a></p>
             <p>If you did not request this, ignore this email.</p>`
    };

    transporter.sendMail(mailOptions).catch(err => {
      console.error('Failed to send reset email', err);
     });

    return res.json(genericSuccess);
  } catch (err) {
    next(err);
  }
};


exports.resetPassword = async (req, res, next) => {
  try {
    const tokenParam = req.params.token;
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'New password required' });

    const record = await ResetToken.findOne({ token: tokenParam }).populate('userId');
    if (!record) return res.status(400).json({ message: 'Invalid or expired token' });

    if (record.used) return res.status(400).json({ message: 'Token already used' });
    if (record.expiresAt < new Date()) return res.status(400).json({ message: 'Token expired' });

    const user = await User.findById(record.userId._id);
    if (!user) return res.status(400).json({ message: 'Invalid token (user not found)' });

    
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    user.password = hashed;
    await user.save();

    record.used = true;
    await record.save();

    await ResetToken.updateMany({ userId: user._id, used: false }, { used: true });

   
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
};
