const { exec } = require('child_process');

function startBluetoothScan(client, topicBase, systemName, log, notifyMQTTAboutDevice, updateTrayMenu, connectedDevices) {
  scanBluetoothDevices(client, topicBase, systemName, log, notifyMQTTAboutDevice, updateTrayMenu, connectedDevices);
  setInterval(() => scanBluetoothDevices(client, topicBase, systemName, log, notifyMQTTAboutDevice, updateTrayMenu, connectedDevices), 30000); // Сканируем устройства каждые 30 секунд
}

function scanBluetoothDevices(client, topicBase, systemName, log, notifyMQTTAboutDevice, updateTrayMenu, connectedDevices) {
  const cmd = `
  bluetoothctl devices | cut -f2 -d' ' | while read uuid; do 
    info=$(bluetoothctl info $uuid); 
    device=$(echo "$info" | grep "Device" | awk '{print $2}');
    name=$(echo "$info" | grep "Name" | awk -F ': ' '{print $2}');
    connected=$(echo "$info" | grep "Connected" | awk -F ': ' '{print $2}');
    echo "{\\\"id\\\":\\\"$device\\\", \\\"name\\\":\\\"$name\\\", \\\"status\\\":\\\"$connected\\\"}";
  done`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      log(`Error scanning Bluetooth devices: ${error}`);
      return;
    }

    try {
      const devices = stdout.trim().split('\n').map(line => JSON.parse(line));
      devices.forEach(device => {
        connectedDevices[device.id] = {
          name: device.name,
          status: device.status === 'yes' ? 'connected' : 'disconnected'
        };
        notifyMQTTAboutDevice(device.id, device.status === 'yes' ? 'connected' : 'disconnected');
      });

      log('Bluetooth devices scanned and updated');
      updateTrayMenu();
    } catch (parseError) {
      log(`Error parsing Bluetooth devices: ${parseError}`);
    }
  });
}

function parseBluetoothDevices(output) {
  const deviceRegex = /Device\s([A-F0-9:]+)\s(.+)/g;
  let devices = [];
  let match;
  while ((match = deviceRegex.exec(output)) !== null) {
    devices.push({ id: match[1], name: match[2] });
  }
  return devices;
}

function connectBluetoothDevice(deviceId, log, notifyMQTTAboutDevice, updateTrayMenu, connectedDevices) {
  exec(`bluetoothctl connect ${deviceId}`, (error, stdout, stderr) => {
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
  exec(`bluetoothctl disconnect ${deviceId}`, (error, stdout, stderr) => {
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
  exec('which bluetoothctl', (error, stdout, stderr) => {
    if (error || !stdout.trim()) {
      log('bluetoothctl is not installed or not in PATH');
      app.quit();
    }
  });
}

module.exports = {
  startBluetoothScan,
  connectBluetoothDevice,
  disconnectBluetoothDevice,
  checkToolAvailability
};
