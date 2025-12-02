const { v4: uuidv4 } = require('uuid');
module.exports = function generateResetToken(){
  return uuidv4() + '-' + Date.now().toString(36);
};
