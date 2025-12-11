import axios from "axios";

export const refineWithGemini = async (steps) => {
  const text = steps.join("\n");

  const prompt = `
Refine the steps below:
- Make them user-friendly.
- Well formatted.
- Add optional nutrition estimate (calories, protein, fat, carbs).

Steps:
${text}

Return JSON only:
{
  "refinedSteps": [],
  "nutrition": {}
}
`;

  const response = await axios.post(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
    {
      contents: [{ parts: [{ text: prompt }] }]
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY
      }
    }
  );

  const result = response.data.candidates[0].content.parts[0].text;
  return JSON.parse(result);
};
