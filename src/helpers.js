const { nativeImage, BrowserWindow } = require("electron");
const path = require("path");

function loadImage(imgPath, size) {
  let iconPath = path.join(__dirname, imgPath);
  let image = nativeImage
    .createFromPath(iconPath)
    .resize({ width: size, height: size });
  return image;
}

function createWindow(file, width, height) {
  let win = new BrowserWindow({
    width: width,
    height: height,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  win.loadFile(file);
  win.on("close", (event) => {
    event.preventDefault();
    win.hide();
  });
  return win;
}

module.exports = {
  loadImage,
  createWindow
};
