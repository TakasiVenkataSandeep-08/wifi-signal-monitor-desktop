const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("signalMonitor", {
  getWifiName() {
    return ipcRenderer.sendSync("getWifiName");
  },
  getRssiValue() {
    return ipcRenderer.sendSync("getRssiValue");
  },
  sendNotificationOnSLack(data) {
    return ipcRenderer.sendSync("sendNotificationOnSLack", data);
  },
});
