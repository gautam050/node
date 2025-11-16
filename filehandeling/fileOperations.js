const fs = require("fs");

function readContent(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return data;
  } catch (error) {
    return "Error reading file.";
  }
}

function appendContent(filePath, newData) {
  try {
    fs.appendFileSync(filePath, newData);
    return "Content appended successfully.";
  } catch (error) {
    return "Error appending to file.";
  }
}

module.exports = { readContent, appendContent };
