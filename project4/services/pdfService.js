import puppeteer from "puppeteer";
import { generateHTML } from "../utils/template.js";

export const generatePDF = async (recipe) => {
  const html = generateHTML(recipe);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle0" });

  const filePath = `./recipe_${Date.now()}.pdf`;
  await page.pdf({ path: filePath, format: "A4" });

  await browser.close();
  return filePath;
};
