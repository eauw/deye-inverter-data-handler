# README
This is a simple services that fetches data from your inverter of type deye 600 sun
and provides it to you MQTT broker.

## Build
(install Docker first)

1. `npm install`

2. `docker build -t deye600 .`

3. Add a file `.env` and set the following variables:
```
INVERTER_ADMIN=[username of your inverter]
INVERTER_PASSWORD=[password of your inverter]
INVERTER_HOST=[IP/hostname of your inverter]
MQTT_IP=[IP/hostname of your MQTT broker]
```

3. `docker run -p 3000:3000 -d --env-file .env deye600`
If you want to use another port change the first 3000 to your preference.

## Values provided by inverter
webdata_sn
webdata_msvn
webdata_ssvn
webdata_pv_type
webdata_rate_p
webdata_now_p
webdata_today_e
webdata_total_e
webdata_alarm
webdata_utime
cover_mid
cover_ver
cover_wmode
cover_ap_ssid
cover_ap_ip
cover_ap_mac
cover_sta_ssid
cover_sta_rssi
cover_sta_ip
cover_sta_mac
status_a
status_b
status_c