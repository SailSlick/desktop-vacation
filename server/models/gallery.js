const async = require('async');
const DBTools = require('../middleware/db');

const db = new DBTools('galleries');

module.exports = {
  verifyGalleryName: galleryName =>
    typeof galleryName === 'string' && galleryName.length > 0,

  verGroupname: groupname =>
    typeof groupname === 'string' && groupname.length <= 20 && groupname.length >= 3,

  verGid: gid => typeof gid === 'string' && gid.length === 24,

  create: (galleryname, uid, cb) => {
    db.findOne({ name: galleryname, uid }, (doc) => {
      if (doc) return cb('user already has db of that name');
      const galleryData = {
        name: galleryname,
        uid,
        users: [],
        tags: [],
        subgallaries: [],
        images: []
      };
      return db.insertOne(galleryData, (res) => {
        if (res) return cb(res);
        return cb('gallery could not be inserted');
      });
    });
  },

  get: (galleryname, uid, cb) => {
    db.findOne({ name: galleryname, uid }, (doc) => {
      if (doc) return cb(null, doc);
      return cb('gallery not found', null);
    });
  },

  getGid: (gid, cb) => {
    db.findOne({ _id: gid }, (doc) => {
      if (doc) return cb(null, doc);
      return cb('gallery not found', null);
    });
  },

  remove: (galleryname, uid, cb) => {
    db.removeOne({ name: galleryname, uid }, (res) => {
      if (res) return cb('gallery deleted');
      return cb('deletion failed');
    });
  },

  update: (galleryname, uid, data, cb) => {
    db.updateOne({ name: galleryname, uid }, data, (res) => {
      if (res) return cb('updated one gallery');
      return cb('gallery not updated');
    });
  },

  addImages: (gid, imageIds, next) => {
    db.findOne({ _id: gid }, (doc) => {
      if (!doc) {
        next('Cannot find gallery');
      } else {
        async.filter(imageIds, (id, cb) => cb(null, !(id in imageIds)), (_err, res) => {
          doc.images.push(...res);
          return db.updateOne({ _id: gid }, doc, _ => next(null));
        });
      }
    });
  },

  updateGid: (galleryname, id, data, cb) => {
    db.updateOne({ name: galleryname, id }, data, (res) => {
      if (res) return cb('updated one gallery');
      return cb('gallery not updated');
    });
  }
};
