"use strict";
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const routes = require('./middleware/routes');

const app = express();

app.use(bodyParser.json());
app.use(session({
  secret: 'hunter7',
  resave: false,
  saveUninitialized: 'false'
}));
app.use('/', routes);

app.use(function(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500);
  res.send(err);
});

app.listen(3000, () => {
  console.log('app listening on port 3k');
});

module.exports = app;
