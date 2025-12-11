import ollama from "ollama";

export const generateOllamaRecipe = async (ingredients) => {
  const prompt = `
You are a recipe generator.
Ingredients: ${ingredients.join(", ")}

Generate:
1. A creative recipe title.
2. Ingredients with correct quantity measurements.
3. At least 5 cooking steps.

Return in JSON:
{
  "title": "",
  "ingredients": [],
  "steps": []
}
`;

  const response = await ollama.generate({
    model: "tinyllama", 
    prompt,
    temperature: 0.7
  });

  return JSON.parse(response.response);
};
