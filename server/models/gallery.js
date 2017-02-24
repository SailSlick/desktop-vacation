const DBTools = require('../middleware/db');

const db = new DBTools('galleries');

module.exports = {
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

  get: (galleryname, id, cb) => {
    db.findOne({ name: galleryname, id }, (doc) => {
      if (doc) return cb(null, doc);
      return cb('gallery not found', null);
    });
  },

  remove: (galleryname, id, cb) => {
    db.removeOne({ name: galleryname, id }, (res) => {
      if (res) return cb('gallery deleted');
      return cb('deletion failed');
    });
  },

  update: (galleryname, id, data, cb) => {
    db.updateOne({ name: galleryname, id }, data, (res) => {
      if (res) return cb('updated one gallery');
      return cb('gallery not updated');
    });
  }
};
