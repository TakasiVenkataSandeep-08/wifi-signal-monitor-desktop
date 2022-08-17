let intervalId;

const sendDesktopNotification = ({ title = "Wifi signal monitor", body }) => {
  new Notification(title, { body });
};

const checkIfConnectedToWifi = () => {
  const wifiName = window.signalMonitor.getWifiName();
  document.getElementById("formWrapper").style.display = !wifiName
    ? "none"
    : "block";
  document.getElementById("noInternetWrapper").style.display = !wifiName
    ? "flex"
    : "none";
  if (!wifiName) {
    sendDesktopNotification({
      body: "Not connected to internet, please try again!",
    });
    return false;
  }

  const rssiValue = window.signalMonitor.getRssiValue();
  document.getElementById("formWrapper").style.display =
    !rssiValue || !parseInt(rssiValue) ? "none" : "block";
  document.getElementById("noInternetWrapper").style.display =
    !rssiValue || !parseInt(rssiValue) ? "flex" : "none";
  if (!rssiValue || !parseInt(rssiValue)) {
    sendDesktopNotification({
      body: "Not connected to internet, please try again!",
    });
    return false;
  }
  return true;
};

const handleDownloadLogsVisibility = () => {
  const savedRssiLogs = localStorage.getItem("rssiLogs");
  if (!savedRssiLogs || !JSON.parse(savedRssiLogs).length) {
    document.getElementById("downloadLogs").style.display = "none";
  } else {
    document.getElementById("downloadLogs").style.display = "block";
  }
};

const handleclearLogsTable = () => {
  document.getElementById("timeLogTable").innerHTML = `<tr class="tableHeader">
                  <td>Wifi Name</td>
                  <td>Timestamp</td>
                  <td>RSSI</td>
                </tr>`;
};

const addRssiLogTableRow = (wifiName, rssiStrength, timestamp) => {
  const rssiLogTable = document.getElementById("timeLogTable");
  const row = rssiLogTable.insertRow(1);
  const wifiNameCell = row.insertCell(0);
  const timeStampCell = row.insertCell(1);
  const rssiStrengthCell = row.insertCell(2);
  wifiNameCell.appendChild(document.createTextNode(wifiName));
  timeStampCell.appendChild(document.createTextNode(timestamp));
  row.style.color =
    rssiStrength >= -50
      ? "#03c04a"
      : rssiStrength < -50 && rssiStrength >= -67
      ? "#fa8128"
      : "#FF0800";
  rssiStrengthCell.appendChild(document.createTextNode(`${rssiStrength} dBm`));
};

const stopInterval = () => {
  clearInterval(intervalId);
  intervalId = null;
};

const initiateWifiSignalMonitor = (sleepTime, webhookUrl, frequency) => {
  const signalValueText = document.getElementById("signalValue");
  const signalValueWrapper = document.getElementById("signalValueWrapper");
  let lowSignalFrequency = 0;
  const notifyOnSlack = localStorage.getItem("notifyOnSlack");
  const isNotifyOnSlackActive = notifyOnSlack && JSON.parse(notifyOnSlack);

  const handleStartMonitoringRssi = () => {
    const wifiName = window.signalMonitor.getWifiName();
    if (!wifiName) {
      document.getElementById("formWrapper").style.display = "none";
      document.getElementById("noInternetWrapper").style.display = "flex";
      stopInterval();
      return;
    }

    const rssiOutput = window.signalMonitor.getRssiValue();
    const rssiStrength = parseInt(rssiOutput);
    if (!rssiStrength) {
      document.getElementById("formWrapper").style.display = "none";
      document.getElementById("noInternetWrapper").style.display = "flex";
      stopInterval();
      return;
    }
    const preserveLogs = localStorage.getItem("preserveLogs");
    const newLogData = {
      wifiName,
      timestamp: `
              ${new Date().toDateString()} ${new Date().toLocaleTimeString()} IST
            `,
      rssiStrength,
    };
    if (preserveLogs && JSON.parse(preserveLogs)) {
      const savedRssiLogs = localStorage.getItem("rssiLogs");
      if (savedRssiLogs) {
        const previousRssiLogs = JSON.parse(savedRssiLogs);
        if (previousRssiLogs) {
          const updatedLogs = [...previousRssiLogs, newLogData].splice(-500);
          localStorage.setItem("rssiLogs", JSON.stringify(updatedLogs));
        }
      } else {
        localStorage.setItem("rssiLogs", JSON.stringify([newLogData]));
      }
    }

    addRssiLogTableRow(wifiName, rssiStrength, newLogData.timestamp);

    signalValueText.innerText = `${rssiStrength} dBm`;
    signalValueWrapper.style.display = "flex";
    signalValueWrapper.style.backgroundColor =
      rssiStrength >= -50
        ? "#03c04a"
        : rssiStrength < -50 && rssiStrength >= -67
        ? "#fa8128"
        : "#FF0800";

    if (rssiStrength < -67) {
      lowSignalFrequency += 1;
      if (lowSignalFrequency === parseInt(frequency)) {
        sendDesktopNotification({
          body: `Observed a continuous dip in your signal, current RSSI is ${rssiStrength} dBm`,
        });

        if (isNotifyOnSlackActive) {
          window.signalMonitor.sendNotificationOnSLack(webhookUrl);
        }
        lowSignalFrequency = 0;
      }
    } else {
      lowSignalFrequency = 0;
    }
  };

  handleStartMonitoringRssi();
  intervalId = setInterval(handleStartMonitoringRssi, sleepTime * 1000);
};

const handleMonitoring = (event) => {
  if (event) event.preventDefault();
  const startMonitoringButton = document.getElementById("startMonitoring");
  const stopMonitoringButton = document.getElementById("stopMonitoring");
  const signalValueWrapper = document.getElementById("signalValueWrapper");
  const webhookUrlInput = document.getElementById("webhookUrl");
  const sleepTimeInput = document.getElementById("sleepTime");
  const frequencyInput = document.getElementById("frequency");
  const contentWrapper = document.getElementById("contentWrapper");
  const configWrapper = document.getElementById("configWrapper");
  const logWrapper = document.getElementById("logWrapper");
  const userPreferenceWrapper = document.getElementById(
    "userPreferenceWrapper"
  );
  const notesWrapper = document.getElementById("notesWrapper");
  const notifyOnSlack = localStorage.getItem("notifyOnSlack");
  const isNotifyOnSlackActive = notifyOnSlack && JSON.parse(notifyOnSlack);

  if (!intervalId) {
    if (
      (isNotifyOnSlackActive && !webhookUrlInput.value) ||
      !sleepTimeInput.value ||
      !frequencyInput.value
    )
      return;
    const isConnectToWifi = checkIfConnectedToWifi();
    if (!isConnectToWifi) return;

    initiateWifiSignalMonitor(
      sleepTimeInput.value,
      webhookUrlInput.value,
      frequencyInput.value
    );
    if (isNotifyOnSlackActive) {
      localStorage.setItem("webhookUrl", webhookUrlInput.value);
      webhookUrlInput.style.display = "none";
    }

    localStorage.setItem("sleepTime", sleepTimeInput.value);
    localStorage.setItem("frequency", frequencyInput.value);
    sleepTimeInput.style.display = "none";
    frequencyInput.style.display = "none";
    startMonitoringButton.style.display = "none";
    stopMonitoringButton.style.display = "block";
    contentWrapper.className = "contentWrapperAfterStart";
    configWrapper.className = "configWrapperAfterStart";
    logWrapper.className = "logWrapperAfterStart";
    userPreferenceWrapper.style.display = "none";
    document.getElementById("downloadLogs").style.display = "none";
    notesWrapper.style.display = "none";
  } else {
    if (intervalId) {
      stopInterval();
    }
    if (isNotifyOnSlackActive) {
      webhookUrlInput.style.display = "block";
    }

    sleepTimeInput.style.display = "block";
    frequencyInput.style.display = "block";
    signalValueWrapper.style.display = "none";
    startMonitoringButton.style.display = "block";
    stopMonitoringButton.style.display = "none";
    contentWrapper.className = "contentWrapper";
    configWrapper.className = "configWrapper";
    logWrapper.className = "logWrapper";
    userPreferenceWrapper.style.display = "flex";
    notesWrapper.style.display = "block";
    const preserveLogs = localStorage.getItem("preserveLogs");
    if (!preserveLogs || !JSON.parse(preserveLogs)) {
      handleclearLogsTable();
    }
    handleDownloadLogsVisibility();
  }
};

const setupWifiSignalMonitor = (skipAutoMonitor = false) => {
  handleDownloadLogsVisibility();

  document.getElementById("autoRestart").addEventListener("change", (event) => {
    const inputChecked = event.currentTarget.checked;
    localStorage.setItem("autoRestart", JSON.stringify(inputChecked));
  });

  document
    .getElementById("notifyOnSlack")
    .addEventListener("change", (event) => {
      const inputChecked = event.currentTarget.checked;
      const webhookUrlInput = document.getElementById("webhookUrl");
      if (inputChecked) {
        const webhookUrl = localStorage.getItem("webhookUrl");
        webhookUrlInput.value = webhookUrl || "";
        webhookUrlInput.setAttribute("required", true);
      } else {
        webhookUrlInput.removeAttribute("required", false);
      }
      webhookUrlInput.style.display = inputChecked ? "block" : "none";
      localStorage.setItem("notifyOnSlack", JSON.stringify(inputChecked));
    });

  document
    .getElementById("preserveLogs")
    .addEventListener("change", (event) => {
      const inputChecked = event.currentTarget.checked;
      localStorage.setItem("preserveLogs", JSON.stringify(inputChecked));
      if (!inputChecked) {
        localStorage.setItem("rssiLogs", JSON.stringify([]));
        document.getElementById("downloadLogs").style.display = "none";
        handleclearLogsTable();
      }
    });

  const sleepTime = localStorage.getItem("sleepTime");
  const frequency = localStorage.getItem("frequency");
  const notifyOnSlack = localStorage.getItem("notifyOnSlack");

  if (sleepTime && frequency) {
    const sleepTimeInput = document.getElementById("sleepTime");
    const frequencyInput = document.getElementById("frequency");
    if (notifyOnSlack && JSON.parse(notifyOnSlack)) {
      const webhookUrl = localStorage.getItem("webhookUrl");
      const webhookUrlInput = document.getElementById("webhookUrl");
      webhookUrlInput.style.display = "block";
      webhookUrlInput.value = webhookUrl || "";
      webhookUrlInput.setAttribute("required", true);
      const notifyOnSlackInput = document.getElementById("notifyOnSlack");
      notifyOnSlackInput.checked = JSON.parse(notifyOnSlack);
    }
    sleepTimeInput.value = parseInt(sleepTime);
    frequencyInput.value = parseInt(frequency);
    const autoRestart = localStorage.getItem("autoRestart");
    const preserveLogs = localStorage.getItem("preserveLogs");
    if (preserveLogs) {
      const isPreserveLogsChecked = JSON.parse(preserveLogs);
      const preserveLogsInput = document.getElementById("preserveLogs");
      preserveLogsInput.checked = isPreserveLogsChecked;
      const savedRssiLogs = localStorage.getItem("rssiLogs");
      if (isPreserveLogsChecked && savedRssiLogs && JSON.parse(savedRssiLogs)) {
        const previousRssiLogs = JSON.parse(savedRssiLogs);

        previousRssiLogs.forEach((log) => {
          addRssiLogTableRow(log.wifiName, log.rssiStrength, log.timestamp);
        });
      }
    }
    if (autoRestart) {
      const isAutoRestartChecked = JSON.parse(autoRestart);
      const autoRestartInput = document.getElementById("autoRestart");
      autoRestartInput.checked = isAutoRestartChecked;
      if (isAutoRestartChecked && !skipAutoMonitor) {
        handleMonitoring();
      }
    }
  }

  document.getElementById("form1").addEventListener("submit", handleMonitoring);

  document.getElementById("downloadLogs").addEventListener("click", () => {
    var table = document.getElementById("timeLogTable");
    var rows = [];

    for (var i = 0, row; (row = table.rows[i]); i++) {
      column1 = row.cells[0].innerText.trim();
      column2 = row.cells[1].innerText.trim();
      column3 = row.cells[2].innerText.trim();
      rows.push([column1, column2, column3]);
    }
    csvContent = "data:text/csv;charset=utf-8,";

    rows.forEach(function (rowArray) {
      row = rowArray.join(",");
      csvContent += row + "\r\n";
    });

    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "RssiLogs.csv");
    document.body.appendChild(link);
    link.click();
  });
};

window.addEventListener("DOMContentLoaded", () => {
  let isSignalMonitorSetup = false;

  document.getElementById("tryAgain").addEventListener("click", () => {
    const isConnectedToWifi = checkIfConnectedToWifi();

    if (!isConnectedToWifi) return;
    if (!isSignalMonitorSetup) setupWifiSignalMonitor(true);
    handleMonitoring();
  });

  const isConnectedToWifi = checkIfConnectedToWifi();
  if (isConnectedToWifi) {
    setupWifiSignalMonitor();
    isSignalMonitorSetup = true;
  }
});
