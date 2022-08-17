# wifi-signal-monitor-desktop

#### Description

**wifi-signal-monitor-desktop** is a desktop application to monitor wifi signal strength on your mac and post a message to a desired channel on slack when ever the RSSI value is less than -67 dBm.

## Key Features

- Auto monitor on app launch.
- Preserve and download RSSI logs.
- Notify on slack thorugh webhook url.

## Local setup

#### Install node modules

```sh
npm install
```

#### Start Electron app

```sh
npm run start
```

### Create electron build for mac app

```sh
npx electron-builder build --mac
```

## Notes

- Sleep time indicates the interval after which the monitoring
  should recurr.
- Signal dip frequency indicates the number of signal dips in
  a row after which the notification will be sent to desired
  slack channel.
- webhook url is used to send a message to a desired slack
  channel.
