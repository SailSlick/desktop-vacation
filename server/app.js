"use strict";
const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./middleware/routes');

const app = express();

app.use(bodyParser.json());

app.use('/', routes);

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json(err);
});

app.listen(3000, () => {
  console.log('app listening on port 3k');
});

module.exports = app;
