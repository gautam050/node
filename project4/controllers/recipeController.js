import { generateOllamaRecipe } from "../services/ollamaService.js";
import { refineWithGemini } from "../services/geminiService.js";
import { generatePDF } from "../services/pdfService.js";
import fs from "fs-extra";

const HISTORY_FILE = "./history.json";

export const generateRecipe = async (req, res) => {
  try {
    const { ingredients } = req.body;

    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({ error: "Invalid ingredients input" });
    }

    // 1. OLLAMA GENERATION
    const ollamaData = await generateOllamaRecipe(ingredients);

    // 2. GEMINI REFINEMENT
    const geminiData = await refineWithGemini(ollamaData.steps);

    // Combine everything
    const finalOutput = {
      title: ollamaData.title,
      ingredients: ollamaData.ingredients,
      refinedSteps: geminiData.refinedSteps,
      nutrition: geminiData.nutrition,
      timestamp: new Date().toISOString()
    };

    // 3. SAVE HISTORY
    let history = [];
    if (fs.existsSync(HISTORY_FILE)) {
      history = JSON.parse(fs.readFileSync(HISTORY_FILE));
    }
    history.push(finalOutput);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));

    // 4. PDF GENERATION
    const pdfPath = await generatePDF(finalOutput);

    return res.json({
      message: "Recipe generated successfully",
      recipe: finalOutput,
      pdf: pdfPath
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

export const compareModels = async (req, res) => {
  res.json({
    message: "You will implement model comparison here."
  });
};

export const getHistory = async (req, res) => {
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      return res.json([]);
    }
    const history = JSON.parse(fs.readFileSync(HISTORY_FILE));
    res.json(history);
  } catch (e) {
    res.status(500).json({ error: "Failed to load history" });
  }
};
