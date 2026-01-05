require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const userRoutes = require("./routes/user.routes");
const errorHandler = require("./middleware/error.middleware");

const app = express();
app.use(express.json());

connectDB();

app.use("/", userRoutes);
app.use(errorHandler);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
