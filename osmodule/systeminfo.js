const os = require("os");

function getSysteminfo() {
  return {
    architecture: os.arch(),
    cpuCores: os.cpus().length,
    cpuModel: os.cpus()[0].model,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    osType: os.type(),
    hostName: os.hostname(),
  };
}

module.exports = getSysteminfo;
