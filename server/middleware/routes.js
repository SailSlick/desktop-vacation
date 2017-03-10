const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const user = require('../controllers/user');
const gallery = require('../controllers/gallery');
const sync = require('../controllers/sync');
const url = require('../../script/db/mongo-url.js');
const storage = require('multer-gridfs-storage')({
  url,
  filename: (req, file, cb) => {
    crypto.randomBytes(16, (err, raw) => {
      cb(err, err ? undefined : raw.toString('hex') + path.extname(file.originalname));
    });
  }
});

const upload = multer({ storage });
const routes = express.Router();

// user functionality
routes.post('/user/create', user.create);
routes.post('/user/login', user.login);

routes.use('/user/*', user.requireAuth);
routes.post('/user/logout', user.logout);
routes.post('/user/update', user.update);
routes.post('/user/delete', user.delete);

// images

// XXX TEMORARY FIX FOR PIECE OF SHIT REQUESTS MODULE ON THE CLIENT SIDE
// which either can't, or doesn't document, being able to stream data
// and send cookies at the same time .
// routes.use('/images/*', user.requireAuth);
routes.get('/image/:id/', sync.download);

// gallery
routes.use('/gallery/*', user.requireAuth);
routes.post('/gallery/create', gallery.create);
routes.use('/gallery/upload', upload.array('images'), sync.upload);
routes.get('/gallery/:gid', gallery.get);

// group management functionality
routes.use('/group/*', user.requireAuth);
routes.post('/group/create', gallery.createGroup);
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
