"use strict";
const express = require('express');
const user = require('../controllers/user');

const routes = express.Router();

routes.post("/user/create", user.create);
routes.post("/user/login", user.login);

routes.post("/user/logout", user.requireAuth, user.logout);
routes.post("/user/update", user.requireAuth, user.update);
routes.post("/user/delete", user.requireAuth, user.delete);

module.exports = routes;
