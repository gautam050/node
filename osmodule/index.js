const getSysteminfo = require("./systeminfo");

const info = getSysteminfo();

console.log("System Information:\n");

console.log(`Architecture: ${info.architecture}`);
console.log(`CPU Cores: ${info.cpuCores}`);
console.log(`CPU Model: ${info.cpuModel}`);
console.log(`Total Memory: ${info.totalMemory} bytes`);
console.log(`Free Memory: ${info.freeMemory} bytes`);
console.log(`Hostname: ${info.hostName}`);
console.log(`OS Type: ${info.osType}`);
