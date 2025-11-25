const express = require("express");
const User = require("../models/user.model");
const router = express.Router();

// POST /add-user
router.post("/add-user", async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await User.create({ name, email });

    res.status(201).json({
      message: "User created successfully",
      user
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
