const express = require('express');
const router = express.Router();
const { signup, login, forgotPassword, resetPassword } = require('../controllers/authController');
const { forgotPasswordLimiter } = require('../middleware/rateLimiter');

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
