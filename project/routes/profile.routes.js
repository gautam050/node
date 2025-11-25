const express = require("express");
const Profile = require("../models/profile.model");
const User = require("../models/user.model");

const router = express.Router();

// POST /add-profile
router.post("/add-profile", async (req, res) => {
  try {
    const { bio, socialMediaLinks, user } = req.body;

    // Check if user exists
    const findUser = await User.findById(user);
    if (!findUser) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Ensure no duplicate profile for same user
    const existingProfile = await Profile.findOne({ user });
    if (existingProfile) {
      return res.status(400).json({ error: "This user already has a profile" });
    }

    const profile = await Profile.create({
      bio,
      socialMediaLinks,
      user
    });

    res.status(201).json({
      message: "Profile created successfully",
      profile
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
