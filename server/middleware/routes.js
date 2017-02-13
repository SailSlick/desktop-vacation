const express = require('express');
const user = require('../controllers/user');

const routes = express.Router();

routes.post('/user/create', user.create);
routes.post('/user/login', user.login);

routes.use('/user/*', user.requireAuth);
routes.post('/user/logout', user.logout);
routes.post('/user/update', user.update);
routes.post('/user/delete', user.delete);

module.exports = routes;
