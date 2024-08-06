const { createWindow } = require("./helpers");
const packageJson = require("../package.json");

let aboutWindow = null;
let settingsWindow = null;
let welcomeWindow = null;

function openWelcomeWindow() {
  if (welcomeWindow !== null) {
    welcomeWindow.focus();
    return;
  }

  welcomeWindow = createWindow("src/popups/welcome.html", 620, 480);
  welcomeWindow.on("close", (event) => {
    welcomeWindow = null;
  });
}

function openSettingsWindow() {
  if (settingsWindow !== null) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = createWindow("src/popups/settings.html", 450, 350);
  settingsWindow.on("close", (event) => {
    settingsWindow = null;
  });
}

function openAboutWindow() {
  if (aboutWindow !== null) {
    aboutWindow.focus();
    return;
  }

  aboutWindow = createWindow("src/popups/about.html", 400, 300);
  aboutWindow.webContents.on("did-finish-load", () => {
    aboutWindow.webContents.send("app-version", packageJson.version);
  });
  aboutWindow.on("close", (event) => {
    aboutWindow = null;
  });
}

module.exports = {
  openSettingsWindow,
  openAboutWindow,
  openWelcomeWindow,
};
