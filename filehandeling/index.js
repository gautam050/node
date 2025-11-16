const { readContent, appendContent } = require("./fileOperations");

const filePath = "./content.txt";

console.log("Initial File Content:");
console.log(readContent(filePath));

console.log("\nAppending data...");
appendContent(filePath, "\nThis is the appended content.");

console.log("\nUpdated File Content:");
console.log(readContent(filePath));
