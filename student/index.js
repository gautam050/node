require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const studentRoutes = require("./routes/studentRoutes");
const courseRoutes = require("./routes/courseRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");

const app = express();
app.use(express.json());

// ROUTES
app.use("/students", studentRoutes);
app.use("/courses", courseRoutes);
app.use("/enroll", enrollmentRoutes);

// CONNECT DB
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// START SERVER
app.listen(8080, () => console.log("Server running on 8080"));
