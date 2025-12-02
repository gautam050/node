const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function(req, res, next){
  const auth = req.header('Authorization');
  if(!auth) return res.status(401).json({ message: 'No token' });
  const token = auth.replace('Bearer ','');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if(!user) return res.status(401).json({ message: 'Invalid token' });
    req.user = user;
    next();
  } catch(err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
