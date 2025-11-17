// fileinfo.js
const path = require("path");

function getFileInfo(filepath) {
    return {
        filename: path.basename(filepath),
        extension: path.extname(filepath),
        directory: path.dirname(filepath)
    };
}

module.exports = getFileInfo;
