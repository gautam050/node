const User = require("../models/user.model");

exports.createUser = async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json(user);
};

exports.addAddress = async (req, res) => {
  const user = await User.findById(req.params.userId);
  user.addresses.push(req.body);
  await user.save();
  res.json(user);
};

exports.getSummary = async (req, res) => {
  const users = await User.find();

  const totalUsers = users.length;
  const totalAddresses = users.reduce(
    (sum, u) => sum + u.addresses.length, 0
  );

  const summary = users.map(u => ({
    name: u.name,
    addressCount: u.addresses.length
  }));

  res.json({ totalUsers, totalAddresses, summary });
};

exports.getUserDetails = async (req, res) => {
  const user = await User.findById(req.params.userId);
  res.json(user);
};
