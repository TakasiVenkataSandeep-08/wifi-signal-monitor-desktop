const shell = require("shelljs");
const { contextBridge } = require("electron");
let nodePath = shell.which("node").toString();
shell.config.execPath = nodePath;

contextBridge.exposeInMainWorld("signalMonitor", {
  getWifiName() {
    const wifiNameOutput = shell.exec(
      "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I | awk '/ SSID:/ {print $2}'",
      { silent: true }
    );
    return wifiNameOutput.stdout;
  },
  getRssiValue() {
    const rssiOutput = shell.exec(
      "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I | grep CtlRSSI | awk -F' '  '{ print $2 }'",
      { silent: true }
    );
    return rssiOutput.stdout;
  },
  sendNotificationOnSLack(webhookUrl) {
    shell.exec(
      `curl -X POST -H 'Content-type: application/json' --data '{"text":"Hi there, your wifi signal :signal_strength: looks weak :small_red_triangle_down:"}' ${webhookUrl}`,
      { silent: true }
    );
  },
});
