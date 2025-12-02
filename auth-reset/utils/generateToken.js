const { v4: uuidv4 } = require('uuid');

function generateResetToken() {
  return uuidv4() + '-' + Date.now().toString(36); 
}

module.exports = generateResetToken;
