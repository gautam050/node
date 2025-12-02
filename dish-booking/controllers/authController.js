const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ResetToken = require('../models/ResetToken'); // create same ResetToken model as earlier example
const generateResetToken = require('../utils/generateToken');
const transporter = require('../config/mailer');

const RESET_TOKEN_EXPIRY_MIN = Number(process.env.RESET_TOKEN_EXPIRY_MIN || 30);

function signJWT(payload){
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '2h' });
}

exports.signup = async (req, res, next) => {
  try{
    const { name, email, password, role } = req.body;
    if(!name||!email||!password) return res.status(400).json({ message: 'Missing fields' });
    const exists = await User.findOne({ email: email.toLowerCase() });
    if(exists) return res.status(409).json({ message: 'Email exists' });
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed, role: role || 'user' });
    const token = signJWT({ id: user._id });
    res.status(201).json({ message: 'User created', token });
  } catch(err){ next(err); }
};

exports.login = async (req,res,next) => {
  try{
    const { email, password } = req.body;
    if(!email||!password) return res.status(400).json({ message: 'Missing fields' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if(!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if(!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = signJWT({ id: user._id });
    res.json({ token });
  } catch(err){ next(err); }
};

exports.forgotPassword = async (req,res,next) => {
  try{
    const { email } = req.body;
    if(!email) return res.status(400).json({ message: 'Email required' });
    const user = await User.findOne({ email: email.toLowerCase() });

    const generic = { message: 'If that email is registered, you will receive a reset link.' };
    if(!user) return res.json(generic);

    const tokenString = generateResetToken();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MIN*60*1000);
    await ResetToken.create({ userId: user._id, token: tokenString, expiresAt });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${encodeURIComponent(tokenString)}`;

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: user.email,
      subject: 'Dish Booking - Password Reset',
      text: `Reset link (valid ${RESET_TOKEN_EXPIRY_MIN} mins): ${resetLink}`,
      html: `<p>Reset link (valid ${RESET_TOKEN_EXPIRY_MIN} mins): <a href="${resetLink}">${resetLink}</a></p>`
    };

    transporter.sendMail(mailOptions).catch(err => console.warn('Mail error', err.message));
    res.json(generic);
  } catch(err){ next(err); }
};

exports.resetPassword = async (req,res,next) => {
  try{
    const { token } = req.params;
    const { password } = req.body;
    if(!password) return res.status(400).json({ message: 'Password required' });
    const record = await ResetToken.findOne({ token }).populate('userId');
    if(!record || record.used || record.expiresAt < new Date()) return res.status(400).json({ message: 'Invalid or expired token' });
    const user = await User.findById(record.userId._id);
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    record.used = true;
    await record.save();
   
    await ResetToken.updateMany({ userId: user._id, used: false }, { used: true });
    res.json({ message: 'Password reset successful' });
  } catch(err){ next(err); }
};
