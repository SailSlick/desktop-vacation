const express = require('express');
const user = require('../controllers/user');
const gallery = require('../controllers/gallery');

const routes = express.Router();

// user functionality
routes.post('/user/create', user.create);
routes.post('/user/login', user.login);

routes.use('/user/*', user.requireAuth);
routes.post('/user/logout', user.logout);
routes.post('/user/update', user.update);
routes.post('/user/delete', user.delete);

// gallery
routes.use('/gallery/*', user.requireAuth);
routes.get('gallery/data', gallery.get);

// group management functionality
routes.use('/group/*', user.requireAuth);
routes.post('/group/create', gallery.create);
routes.post('/group/switch', gallery.switch);
routes.post('/group/delete', gallery.delete);
routes.get('/group/', gallery.getGroupList);

// group user functionality
routes.get('/group/user/', gallery.getInviteList);
routes.post('/group/user/invite', gallery.inviteUser);
routes.post('/group/user/remove', gallery.removeUser);
routes.post('/group/user/join', gallery.join);
routes.post('/group/user/refuse', gallery.refuse);

// group data functionality
routes.get('/group/data', gallery.getGroup);
routes.post('/group/data/add', gallery.addGroupItem);
routes.post('/group/data/remove', gallery.removeGroupItem);

module.exports = routes;
