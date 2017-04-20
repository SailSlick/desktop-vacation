const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const routes = require('./middleware/routes');
const url = require('../script/db/mongo-url.js');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(session({
  secret: 'hunter7',
  resave: false,
  saveUninitialized: 'false',
  cookie: { maxAge: 900000 },
  store: new MongoStore({
    url,
    autoRemove: 'interval',
    autoRemoveInterval: 15
  }),
}));
app.use('/', routes);

app.use((req, res, _next) => {
  res.status(404).json({
    message: 'resource not found',
    status: 404 // status is here for backwards compatability
  });
});

app.use((result, req, res, _next) => {
  if (typeof (result) === 'string') {
    return res.status(500).send({ error: result });
  } if (!result.status) {
    return res.status(500).json({
      error: result.message,
      status: 500 // status is here for backwards compatability
    });
  }
  return res.status(result.status).json(result);
});

app.listen(process.env.SRVPORT || 3000, () => {
  console.log('app listening on port ', process.env.SRVPORT || 3000);
});

module.exports = app;
