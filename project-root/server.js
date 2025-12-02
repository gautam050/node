require("dotenv").config();
const express = require("express");
const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error", err));

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL, // e.g. http://localhost:4000/auth/github/callback
      scope: ["user:email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const githubId = profile.id;
        const username = profile.username || profile.displayName;

        let email = null;
        if (Array.isArray(profile.emails) && profile.emails.length) {
          const primary =
            profile.emails.find((e) => e.primary) || profile.emails[0];
          email = primary && primary.value;
        }

        let user = await User.findOne({ githubId });
        if (!user) {
          user = await User.create({ githubId, username, email });
        } else {
          let changed = false;
          if (!user.username && username) {
            user.username = username;
            changed = true;
          }
          if (!user.email && email) {
            user.email = email;
            changed = true;
          }
          if (changed) await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((u) => done(null, u))
    .catch((e) => done(e));
});

app.use(passport.initialize());

app.get("/auth/github", passport.authenticate("github", { session: false }));

app.get("/auth/github/callback", (req, res, next) => {
  passport.authenticate("github", { session: false }, (err, user, info) => {
    if (err)
      return res
        .status(500)
        .json({ error: "Authentication error", details: err.message });
    if (!user) return res.status(401).json({ error: "No user" });

    const payload = {
      sub: user._id,
      githubId: user.githubId,
      username: user.username,
      email: user.email,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES || "7d",
    });

    return res.json({ token });
  })(req, res, next);
});

app.get("/me", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ error: "Missing token" });
  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.sub).select("-__v");
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ user });
  } catch (err) {
    return res
      .status(401)
      .json({ error: "Invalid token", details: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
