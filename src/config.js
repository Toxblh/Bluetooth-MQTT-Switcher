const path = require("path");
const os = require("os");
const fs = require("fs");

const configFile = ".config/bluetooth-mqtt-switcher";
const configDirPath = path.join(os.homedir(), configFile);
const configFilePath = path.join(configDirPath, "config.json");

function loadConfig() {
  if (!fs.existsSync(configFilePath)) {
    if (!fs.existsSync(configDirPath)) {
      fs.mkdirSync(configDirPath, { recursive: true });
    }
    const defaultConfig = {
      firstTime: true,
      mqttBroker: "mqtt://localhost:1883",
    };
    fs.writeFileSync(configFilePath, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }
  return JSON.parse(fs.readFileSync(configFilePath));
}

function saveConfig(config) {
  if (!fs.existsSync(configDirPath)) {
    fs.mkdirSync(configDirPath, { recursive: true });
  }

  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
}

module.exports = {
  loadConfig,
  saveConfig,
};
