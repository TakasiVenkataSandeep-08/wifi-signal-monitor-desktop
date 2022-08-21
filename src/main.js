const path = require("path");
const { app, BrowserWindow, ipcMain } = require("electron");
const { execSync } = require("child_process");
const executeCommand = (command) => {
  const result = execSync(command);
  return result.toString("utf8");
};
const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile(path.join(__dirname, "index.html"));
};

app.whenReady().then(() => {
  ipcMain.on("getWifiName", (event) => {
    const wifiNameOutput = executeCommand(
      `/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I | awk -F:  '($1 ~ "^ *SSID$"){print $2}' | cut -c 2-`
    );
    event.returnValue = wifiNameOutput;
  });

  ipcMain.on("getRssiValue", (event) => {
    const rssiOutput = executeCommand(
      "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I | grep CtlRSSI | awk -F' '  '{ print $2 }'"
    );
    event.returnValue = rssiOutput;
  });

  ipcMain.on("sendNotificationOnSLack", (event, webhookUrl) => {
    executeCommand(
      `curl -X POST -H 'Content-Type:application/json' --data '{"text":"Hi there, your wifi signal :signal_strength: looks weak :small_red_triangle_down:"}' ${webhookUrl}`
    );
    event.returnValue = "notification sent";
  });

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
