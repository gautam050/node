import express from "express";
import { generateRecipe, compareModels, getHistory } from "../controllers/recipeController.js";

const router = express.Router();

router.post("/generate-recipe", generateRecipe);
router.get("/compare-models", compareModels);
router.get("/history", getHistory);

export default router;
