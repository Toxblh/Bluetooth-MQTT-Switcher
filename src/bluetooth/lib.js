const os = require('os');
const platform = os.platform();
let bluetoothModule;

if (platform === 'darwin') {
  bluetoothModule = require('./macos');
} else if (platform === 'linux') {
  bluetoothModule = require('./linux');
} else {
  throw new Error('Unsupported platform');
}

module.exports = bluetoothModule;
