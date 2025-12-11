export const generateHTML = (data) => {
  return `
  <html>
    <head>
      <style>
        body { font-family: Arial; padding: 20px; }
        h1 { color: #2c3e50; }
        .section { margin-bottom: 20px; }
        ul { line-height: 1.6; }
      </style>
    </head>
    <body>
      <h1>${data.title}</h1>

      <div class="section">
        <h2>Ingredients</h2>
        <ul>
          ${data.ingredients.map(i => `<li>${i}</li>`).join("")}
        </ul>
      </div>

      <div class="section">
        <h2>Steps</h2>
        <ol>
          ${data.refinedSteps.map(s => `<li>${s}</li>`).join("")}
        </ol>
      </div>

      <div class="section">
        <h2>Nutrition</h2>
        <pre>${JSON.stringify(data.nutrition, null, 2)}</pre>
      </div>
    </body>
  </html>
  `;
};
