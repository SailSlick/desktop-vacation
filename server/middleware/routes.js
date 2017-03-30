const express = require('express');
const multer = require('multer');
const user = require('../controllers/user');
const gallery = require('../controllers/gallery');
const sync = require('../controllers/sync');
const url = require('../../script/db/mongo-url.js');
const storage = require('multer-gridfs-storage')({
  url
});

const uploadStorage = multer({ storage });
const routes = express.Router();

// user functionality
routes.post('/user/create', user.create);
routes.post('/user/login', user.login);

routes.use('/user/*', user.requireAuth);
routes.post('/user/logout', user.logout);
routes.post('/user/update', user.update);
routes.post('/user/delete', user.delete);

// images

routes.use('/image/*', user.requireAuth);
routes.get('/image/:id/', sync.download);
routes.post('/image/:id/remove', sync.remove);

// gallery
routes.use('/gallery/*', user.requireAuth);
routes.post('/gallery/create', gallery.create);
routes.use('/gallery/upload', uploadStorage.array('images'), sync.upload);
routes.get('/gallery/:gid', gallery.get);


// group management functionality
routes.use('/group/*', user.requireAuth);
routes.post('/group/create', gallery.createGroup);
routes.post('/group/convert', gallery.convert);
routes.post('/group/delete', gallery.deleteGroup);
routes.get('/group/', gallery.getGroupList);

// group user functionality
routes.get('/group/user/', gallery.getInviteList);
routes.post('/group/user/invite', gallery.inviteUser);
routes.post('/group/user/remove', gallery.removeUser);
routes.post('/group/user/join', gallery.join);
routes.post('/group/user/refuse', gallery.refuse);

// group data functionality
routes.get('/group/:gid', gallery.getGroup);
routes.post('/group/:gid/add', gallery.addGroupItem);
routes.post('/group/:gid/remove', gallery.removeGroupItem);

module.exports = routes;
