const { app, Tray, Menu, BrowserWindow, ipcMain } = require("electron");
const mqtt = require("mqtt");
const os = require("os");

const bluetooth = require("./bluetooth/lib");
const { log } = require("./log");
const { createWindow, loadImage } = require("./helpers");
const { loadConfig, saveConfig } = require("./config");
const {
  openSettingsWindow,
  openAboutWindow,
  openWelcomeWindow,
} = require("./popups");

const systemName = os.hostname();
const onlineSystems = {};
const connectedDevices = {};
const deviceStatuses = {};
const topicBase = "bluetooth-mqtt-switcher";

const BluetoothConnectWait = 3000;
const HealthcheckInterval = 5000;
const OfflineTimeout = 10000;

let config = loadConfig();
let tray = null;

const icon = loadImage("assets/icon.png", 16);
const greenCircle = loadImage("assets/green_circle.png", 8);

let client = mqtt.connect(config.mqttBroker);

function configMQTT() {
  client.end();

  client = mqtt.connect(config.mqttBroker);
  
  client.on("connect", () => updateMQTTStatus(true));
  client.on("offline", () => updateMQTTStatus(false));
  client.on("error", () => updateMQTTStatus(false));

  client.on("message", (topic, message) => {
    if (topic.startsWith(`${topicBase}/healthcheck`)) {
      handleHealthCheck(topic, message);
    }
    
    if (topic.startsWith(`${topicBase}/request`)) {
      handleBluetoothRequest(topic, message);
    }
    
    if (topic.startsWith(`${topicBase}/status`)) {
      handleBluetoothStatus(topic, message);
    }
  });
  
  client.subscribe(`${topicBase}/healthcheck/#`);
  client.subscribe(`${topicBase}/request/#`);
  client.subscribe(`${topicBase}/status/#`);
}

app.on("ready", () => {
  configMQTT();
  tray = new Tray(icon);
  updateTrayMenu();

  log("Application started");
  bluetooth.checkToolAvailability(log, app);
  startHealthCheck();

  bluetooth.startBluetoothScan(
    client,
    topicBase,
    systemName,
    log,
    notifyMQTTAboutDevice,
    updateTrayMenu,
    connectedDevices
  );

  if (config.firstTime) {
    openWelcomeWindow();
    config = { ...config, firstTime: false };
    saveConfig(config);
  }
});

function sendHealthcheckMessage() {
  const healthcheckMessage = JSON.stringify({
    status: "online",
    system: systemName,
    now: Date.now(),
  });

  client.publish(`${topicBase}/healthcheck/${systemName}`, healthcheckMessage);
}

function updateOnlineSystems() {
  console.log("Updating online systems");
  const currentTime = Date.now();
  /////
  console.info(onlineSystems);
  /////

  for (const system in onlineSystems) {
    if (currentTime - onlineSystems[system] > OfflineTimeout) {
      delete onlineSystems[system];
    }
  }

  updateTrayMenu();
}

function startHealthCheck() {
  setInterval(sendHealthcheckMessage, HealthcheckInterval);
  setInterval(updateOnlineSystems, OfflineTimeout);
}

/// Handle MQTT messages

function handleHealthCheck(topic, message) {
  const { system, status, now } = JSON.parse(message);
  log(`Healthcheck received from ${system} with status: ${status}`);
  if (status === "online") {
    onlineSystems[system] = now;
  }
  updateTrayMenu();
}

function handleBluetoothRequest(topic, message) {
  const { deviceId, requested } = JSON.parse(message);
  log(`Bluetooth disconnect request received for device: ${deviceId}`);
  
  if (requested === systemName) {
    return;
  }

  if (connectedDevices[deviceId]) {
    bluetooth.disconnectBluetoothDevice(
      deviceId,
      log,
      notifyMQTTAboutDevice,
      updateTrayMenu,
      connectedDevices
    );
  }
}

function handleBluetoothStatus(topic, message) {
  const { deviceId, status, name, system } = JSON.parse(message);
  
  if (!deviceStatuses[deviceId]) {
    deviceStatuses[deviceId] = {};
  }
  
  deviceStatuses[deviceId][system] = {
    name: name,
    status: status,
    system: system,
  };

  updateTrayMenu();
}

function updateTrayMenu() {
  const mqttStatus = client.connected
    ? "MQTT: Connected"
    : "MQTT: Not Connected";

  const deviceMenuItems = Object.keys(connectedDevices).map((id) => ({
    label: `${connectedDevices[id].name} ${getDeviceStatus(id)}`,
    click: () => requestBluetoothConnection(id),
  }));

  const systemMenuItems = Object.keys(onlineSystems).map((system) => ({
    label: `${system}`,
    icon: greenCircle,
  }));

  const contextMenu = Menu.buildFromTemplate([
    ...deviceMenuItems,
    { type: "separator" },
    ...systemMenuItems,
    { type: "separator" },
    { label: mqttStatus, enabled: false },
    { type: "separator" },
    { label: "Settings", click: openSettingsWindow },
    { label: "About", click: openAboutWindow },
    {
      label: "Exit",
      click: () => {
        app.isQuitting = true;
        const windows = BrowserWindow.getAllWindows();
        windows.forEach((win) => {
          win.close();
        });
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

function getDeviceStatus(deviceId) {
  if (connectedDevices[deviceId].status === "connected") {
    return "connected";
  } else {
    for (const [system, statusInfo] of Object.entries(
      deviceStatuses[deviceId] || {}
    )) {
      if (statusInfo.status === "connected" && system !== systemName) {
        return `with ${system}`;
      }
    }
    return "";
  }
}

function requestBluetoothConnection(deviceId) {
  const requestMessage = JSON.stringify({ deviceId, requested: systemName });

  client.publish(`${topicBase}/request/${deviceId}`, requestMessage);
  log(`Bluetooth connection request sent for device: ${deviceId}`);

  setTimeout(() => {
    bluetooth.connectBluetoothDevice(
      deviceId,
      log,
      notifyMQTTAboutDevice,
      updateTrayMenu,
      connectedDevices
    );
  }, BluetoothConnectWait);
}

function notifyMQTTAboutDevice(deviceId, status) {
  const statusMessage = JSON.stringify({
    deviceId,
    status,
    name: connectedDevices[deviceId].name,
    system: systemName,
  });

  client.publish(
    `${topicBase}/status/${systemName}/${deviceId}`,
    statusMessage
  );
  log(
    `MQTT status notification sent - Device: ${connectedDevices[deviceId].name} (${deviceId}), Status: ${status}`
  );
}

//// IPC communication

function updateMQTTStatus(isConnected) {
  ipcMain.emit("mqtt-status", isConnected);
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send("mqtt-status", isConnected);
  });

  updateTrayMenu();
}

ipcMain.on("request-settings", (event) => {
  event.sender.send("load-settings", config);
  event.sender.send("mqtt-status", client.connected);
});

ipcMain.on("save-settings", (event, newConfig) => {
  config = { ...config, ...newConfig };
  saveConfig(config);
  configMQTT();
});

app.on("before-quit", () => (app.isQuitting = true));

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

if (process.platform === "darwin") {
  app.dock.hide();
}
