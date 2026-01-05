require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const vehicleRoutes = require("./routes/vehicle.routes");
const errorHandler = require("./middleware/error.middleware");

const app = express();
app.use(express.json());

connectDB();
app.use("/", vehicleRoutes);
app.use(errorHandler);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
