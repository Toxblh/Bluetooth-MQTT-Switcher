const fs = require("fs");
const os = require("os");
const path = require("path");

const logFile = path.join(os.homedir(), "bluetooth-mqtt-switcher.log");
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB
const THRESHOLD_LOG_SIZE = 512 * 1024; // 512KB

function manageLogSize() {
  const stats = fs.statSync(logFile);
  if (stats.size > MAX_LOG_SIZE) {
    const data = fs.readFileSync(logFile, "utf-8");
    const lines = data.split("\n");
    let newData = "";
    for (let i = lines.length - 1; i >= 0; i--) {
      newData = lines[i] + "\n" + newData;
      if (Buffer.byteLength(newData, "utf-8") <= MAX_LOG_SIZE - THRESHOLD_LOG_SIZE) {
        break;
      }
    }
    fs.writeFileSync(logFile, newData.trim());
  }
}

function log(message) {
  manageLogSize();
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}

module.exports = {
  log,
};