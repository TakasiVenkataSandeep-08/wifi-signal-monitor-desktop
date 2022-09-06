# Wifi-Signal-Monitor-Desktop

#### Description

**Wifi Signal Monitor** is a desktop application to monitor wifi signal strength on your mac and post a message to a desired channel on slack when ever the RSSI value is less than -67 dBm.

## Key Features

- Auto monitor on app launch.
- Preserve and download latest 500 RSSI logs.
- Notify on slack if a valid slack webhook url is provided.

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
npx run build
```

## Notes

- Sleep time indicates the interval after which the monitoring
  should recur.
- Signal dip frequency indicates the number of signal dips (< -67dBm) in
  a row after which a Desktop notification is sent and a notification will be sent to desired
  slack channel (if notify on slack option is checked and a valid webhook url is provided).
- webhook url is required to send notifications to a desired slack
  channel.
