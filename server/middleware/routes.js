const express = require('express');
const user = require('../controllers/user');
const gallery = require('../controllers/gallery');
const image = require('../controllers/image');

const routes = express.Router();

// user functionality
routes.post('/user/create', user.create);
routes.post('/user/login', user.login);

routes.use('/user/*', user.requireAuth);
routes.post('/user/logout', user.logout);
routes.post('/user/update', user.update);
routes.post('/user/delete', user.delete);

// images
const imageRouter = express.Router();
routes.use('/image', imageRouter);
imageRouter.use('/:id/', image.checkId);
imageRouter.get('/:id/', image.download);
imageRouter.use(user.requireAuth);
imageRouter.use('/upload', image.uploadMiddleware, image.upload);
imageRouter.post('/:id/remove', image.remove);
imageRouter.post('/:id/share', image.shareImage);
imageRouter.post('/:id/unshare', image.unshareImage);
imageRouter.use('/:id/:gid', gallery.checkGid);
imageRouter.get('/:id/:gid', image.groupImageDownload);

// gallery
const galleryRouter = express.Router();
routes.use('/gallery', galleryRouter);
galleryRouter.use(user.requireAuth);
galleryRouter.post('/upload', gallery.upload);
galleryRouter.use('/:gid', gallery.checkGid);
galleryRouter.get('/:gid', gallery.get);
galleryRouter.post('/:gid/remove', gallery.remove);

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
