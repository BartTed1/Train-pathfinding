require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const routes = require("./routes/routes");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

app.use("/", routes);

app.use((req, res, next) => {
    res.sendStatus(404);
});

module.exports = app;