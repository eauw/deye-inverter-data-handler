const Promise = require("bluebird");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();

const mqtt = require("mqtt");
const axios = require("axios");
require("dotenv").config();

if (!process.env.MQTT_IP) {
  console.log("MQTT_IP is missing.");
  return;
}

if (!process.env.INVERTER_ADMIN) {
  console.log("INVERTER_ADMIN is missing.");
  return;
}

if (!process.env.INVERTER_PASSWORD) {
  console.log("INVERTER_PASSWORD is missing.");
  return;
}

if (!process.env.INVERTER_HOST) {
  console.log("INVERTER_HOST is missing.");
  return;
}

let INTERVAL_MS = 3000;
if (!process.env.INTERVAL_MS) {
  console.log("INTERVAL_MS is not set. Default is 3000.");
}

const mqttBroker = "mqtt://" + process.env.MQTT_IP;
console.log(`mqttBroker ${mqttBroker}`);
const prefix = "deye600/";

const inverterAdmin = process.env.INVERTER_ADMIN;
const inverterPassword = process.env.INVERTER_PASSWORD;
const inverterIP = process.env.INVERTER_HOST;
const inverterUrl = `http://${inverterIP}/status.html`;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const client = mqtt.connect(mqttBroker);

// A simple route to manually request the current power via GET request.
app.get("/power", (req, res) => {
  fetchData()
    .then((value) => {
      res.status(200).send(value);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

app.get("/", (req, res) => {
  res.status(200).send("ok");
});

const server = app.listen(3000, function () {
  console.log("app running on port.", server.address().port);
});

const fetchData = () => {
  return new Promise((resolve, reject) => {
    axios
      .get(inverterUrl, {
        auth: {
          username: inverterAdmin,
          password: inverterPassword,
        },
      })
      .then(function (response) {
        const data = parseData(response.data);
        console.log("---");
        console.log(`power: ${data.power} W`);
        console.log(`yieldToday: ${data.yieldToday} kW`);
        console.log(`yieldTotal: ${data.yieldTotal} kW`);
        console.log(`alerts: ${data.power}`);
        console.log("---");
        resolve(data);
      })
      .catch(function (error) {
        switch (error.code) {
          case "ENOTFOUND":
            reject(error.code);
            break;
          case "EHOSTDOWN":
            reject(error.code);
            break;
          case "EHOSTUNREACH":
            reject(error.code);
            break;
          case "ECONNREFUSED":
            reject(error.code);
            break;
          case "ECONNRESET":
            reject(error.code);
            break;
          case "ERR_BAD_REQUEST":
            console.log("Error ERR_BAD_REQUEST: Please check the credentials.");
            console.log(error);
            reject(error.code);
            break;
          case "ERR_BAD_RESPONSE":
            reject(error.code);
            break;
          default:
            console.log(error);
            reject(error.code);
            break;
        }
      });
  });
};

setInterval(function () {
  fetchData()
    .then((data) => {
      publish(data.power, data.yieldToday, data.yieldTotal, data.alerts, "");
    })
    .catch((error) => {
      console.log("error fetching data");
      console.log(error);
      publish("", "", "", "", error);
    });
}, INTERVAL_MS);

const publish = (power, yieldToday, yieldTotal, alerts, error) => {
  client.publish(prefix + "power", power);
  client.publish(prefix + "yieldToday", yieldToday);
  client.publish(prefix + "yieldTotal", yieldTotal);
  client.publish(prefix + "alerts", alerts);
  client.publish(prefix + "error", error);
};

const parseData = (string) => {
  const power = getPower(string);
  const yieldToday = getYieldToday(string);
  const yieldTotal = getYieldTotal(string);
  const alerts = getAlerts(string);
  return { power, yieldToday, yieldTotal, alerts };
};

const getPower = (string) => {
  const regex = /webdata_now_p = "(\d+)";/;
  const matches = string.match(regex);
  if (matches && matches.length > 1) {
    return matches[1];
  }
  return null;
};

const getYieldToday = (string) => {
  const regex = /webdata_today_e = "(.+)";/;
  const matches = string.match(regex);
  if (matches && matches.length > 1) {
    return matches[1];
  }
  return null;
};

const getYieldTotal = (string) => {
  const regex = /webdata_total_e = "(.+)";/;
  const matches = string.match(regex);
  if (matches && matches.length > 1) {
    return matches[1];
  }
  return null;
};

const getAlerts = (string) => {
  const regex = /webdata_alarm = "(.+)";/;
  const matches = string.match(regex);
  if (matches && matches.length > 1) {
    return matches[1];
  }
  return null;
};
