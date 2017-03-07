const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const routes = require('./middleware/routes');

const app = express();

app.use(bodyParser.json());
app.use(session({
  secret: 'hunter7',
  resave: false,
  saveUninitialized: 'false',
  cookie: { maxAge: 900000 }
}));
app.use('/', routes);

app.use((err, req, res, _next) => {
  if (typeof (err) === 'string') {
    return res.status(500).send(err);
  }
  return res.status(err.status).json(err);
});

app.listen(process.env.SRVPORT || 3000, () => {
  console.log('app listening on port ', process.env.SRVPORT || 3000);
});

module.exports = app;
