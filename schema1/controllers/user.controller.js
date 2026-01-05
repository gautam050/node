const User = require("../models/user.model");

exports.addUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

exports.addProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.profiles.push(req.body);
    await user.save();
    res.json(user);
  } catch (err) {
    next(err);
  }
};


exports.getUsers = async (req, res) => {
  const { profile } = req.query;

  let users = await User.find();
  if (profile) {
    users = users.filter(u =>
      u.profiles.some(p => p.profileName === profile)
    );
  }
  res.json(users);
};


exports.search = async (req, res) => {
  const { name, profile } = req.query;

  const user = await User.findOne({ name });
  if (!user) return res.status(404).json({ message: "User not found" });

  const prof = user.profiles.find(p => p.profileName === profile);
  if (!prof) {
    return res.json({
      message: "User found, but profile not found",
      user
    });
  }

  res.json(prof);
};


exports.updateProfile = async (req, res) => {
  const { userId, profileName } = req.params;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const profile = user.profiles.find(p => p.profileName === profileName);
  if (!profile) return res.status(404).json({ message: "Profile not found" });

  profile.url = req.body.url;
  await user.save();
  res.json(user);
};


exports.deleteProfile = async (req, res) => {
  const { userId, profileName } = req.params;

  const user = await User.findByIdAndUpdate(
    userId,
    { $pull: { profiles: { profileName } } },
    { new: true }
  );

  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};
