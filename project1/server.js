import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const app = express();
app.use(express.json());


app.use("/api", authRoutes);

app.get("/", (req, res) => {
  res.send("User Authentication API");
});


const PORT = process.env.PORT || 8080;
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server running on port ${PORT}`);
});
