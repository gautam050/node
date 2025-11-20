const express = require("express");
const rateLimit = require("express-rate-limit");

const app = express();

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,      // 1 minute
  max: 5,                       // limit each IP to 5 requests per window
  message: {
    error: "Too many requests, please try again later."
  }
});


app.get("/public", (req, res) => {
  return res.json({ msg: "This is a public endpoint" });
});


app.get("/restricted", limiter, (req, res) => {
  return res.json({ msg: "You have access to this limited endpoint" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});


app.listen(3000, () => {
  console.log("Server running on port 3000");
  console.log("Public route -> http://localhost:3000/public");
  console.log("Restricted route -> http://localhost:3000/restricted");
});
