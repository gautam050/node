const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
githubId: { type: String, required: true, unique: true },
username: { type: String },
email: { type: String },
}, { timestamps: true });


module.exports = mongoose.model('User', userSchema);