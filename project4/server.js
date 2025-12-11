import express from "express";
import dotenv from "dotenv";
import recipeRoutes from "./routes/recipeRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api", recipeRoutes);

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
