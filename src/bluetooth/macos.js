const { exec } = require('child_process');
const plist = require('plist');
const fs = require('fs');
let blueutilPath;
let connectedDevices = {};

function formatBluetoothAddress(address) {
  return address.toUpperCase().split('-').join(':');
}

function startBluetoothScan(client, topicBase, systemName, log, notifyMQTTAboutDevice, updateTrayMenu, connectedDevices) {
  scanBluetoothDevices(client, topicBase, systemName, log, notifyMQTTAboutDevice, updateTrayMenu, connectedDevices);
  setInterval(() => scanBluetoothDevices(client, topicBase, systemName, log, notifyMQTTAboutDevice, updateTrayMenu, connectedDevices), 30000); // Сканируем устройства каждые 30 секунд
}

function scanBluetoothDevices(client, topicBase, systemName, log, notifyMQTTAboutDevice, updateTrayMenu, connectedDevices) {
  exec(`${blueutilPath} --paired --format json`, async (error, stdout, stderr) => {
      if (error) {
          log(`Error scanning Bluetooth devices: ${error}`);
          return;
      }

      const devices = JSON.parse(stdout);
      const connectedStatus = await getBluetoothDevices();

      const connectedMap = connectedStatus.reduce((acc, device) => {
          acc[device.deviceId] = device.connected;
          return acc;
      }, {});

      devices.forEach(device => {
          const formattedAddress = formatBluetoothAddress(device.address);
          const isConnected = connectedMap[formattedAddress] || false;
          connectedDevices[formattedAddress] = {
              name: device.name,
              status: isConnected ? 'connected' : 'disconnected'
          };
          notifyMQTTAboutDevice(formattedAddress, isConnected ? 'connected' : 'disconnected');
      });

      log('Bluetooth devices scanned and updated');
      updateTrayMenu();
  });
}

function connectBluetoothDevice(deviceId, log, notifyMQTTAboutDevice, updateTrayMenu, connectedDevices) {
  exec(`${blueutilPath} --connect ${deviceId}`, (error, stdout, stderr) => {
    if (error) {
      log(`Error connecting to Bluetooth device: ${error}`);
      return;
    }
    connectedDevices[deviceId].status = 'connected';
    notifyMQTTAboutDevice(deviceId, 'connected');
    log(`Connected to Bluetooth device: ${deviceId}`);
    updateTrayMenu();
  });
}

function disconnectBluetoothDevice(deviceId, log, notifyMQTTAboutDevice, updateTrayMenu, connectedDevices) {
  exec(`${blueutilPath} --disconnect ${deviceId}`, (error, stdout, stderr) => {
    if (error) {
      log(`Error disconnecting from Bluetooth device: ${error}`);
      return;
    }
    connectedDevices[deviceId].status = 'disconnected';
    notifyMQTTAboutDevice(deviceId, 'disconnected');
    log(`Disconnected from Bluetooth device: ${deviceId}`);
    updateTrayMenu();
  });
}

function checkToolAvailability(log, app) {
  const possiblePaths = [
    '/usr/local/bin/blueutil',
    '/opt/homebrew/bin/blueutil',
    '/usr/bin/blueutil'
  ];

  for (const path of possiblePaths) {
    if (fs.existsSync(path)) {
      blueutilPath = path;
      log(`blueutil found at: ${blueutilPath}`);
      return;
    }
  }

  exec('which blueutil', (error, stdout, stderr) => {
    if (error || !stdout.trim()) {
      log('blueutil is not installed or not in PATH');
      app.quit();
    } else {
      blueutilPath = stdout.trim();
      log(`blueutil found at: ${blueutilPath}`);
    }
  });
}

function getBluetoothDevices() {
  return new Promise((resolve, reject) => {
      exec('system_profiler SPBluetoothDataType -xml', (error, stdout, stderr) => {
          if (error) {
              reject(`Error running system profiler: ${error.message}`);
              return;
          }
          if (stderr) {
              reject(`Error: ${stderr}`);
              return;
          }

          try {
              const data = plist.parse(stdout);
              const btDevices = [];

              data.forEach(item => {
                  if (item._dataType === 'SPBluetoothDataType') {
                      const btInfo = item._items;
                      btInfo.forEach(info => {
                          if (info.device_connected && Array.isArray(info.device_connected)) {
                              info.device_connected.forEach(deviceObj => {
                                  Object.keys(deviceObj).forEach(deviceName => {
                                      const device = deviceObj[deviceName];
                                      btDevices.push({
                                          name: deviceName || 'N/A',
                                          deviceId: device.device_address || 'N/A',
                                          connected: true
                                      });
                                  });
                              });
                          } else if (info.devices_list) {
                              info.devices_list.forEach(deviceObj => {
                                  Object.keys(deviceObj).forEach(deviceName => {
                                      const device = deviceObj[deviceName];
                                      btDevices.push({
                                          name: deviceName || 'N/A',
                                          deviceId: device.device_address || 'N/A',
                                          connected: true
                                      });
                                  });
                              });
                          }
                      });
                  }
              });

              resolve(btDevices);
          } catch (err) {
              reject(`Error parsing plist: ${err.message}`);
          }
      });
  });
}

module.exports = {
  startBluetoothScan,
  connectBluetoothDevice,
  disconnectBluetoothDevice,
  checkToolAvailability
};
