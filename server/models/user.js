const DBTools = require('../middleware/db');
const galleryModel = require('./gallery');

const db = new DBTools('users');

module.exports = {
  verifyPassword: password =>
    typeof password === 'string' && password.length > 6 && password.length < 256,

  verifyUsername: username =>
    typeof username === 'string' && username.indexOf(' ') === -1,

  add: (username, password, cb) => {
    db.findOne({ username }, (data) => {
      if (data) return cb('username taken', null);
      const userData = {
        username,
        password,
        gallery: '',
        invites: [],
        groups: []
      };
      return db.insertOne(userData, (added) => {
        if (added) {
          galleryModel.create(username.concat('_all'), null, added.toString(), (err, g_id) => {
            if (err) return cb('failed to create base gallery', null);
            userData.gallery = g_id;
            return db.updateOne({ _id: db.getId(added) }, userData, (res) => {
              if (res) return cb(null, { uid: added, baseGalleryId: g_id });
              return cb('failed to set base gallery id', null);
            });
          });
        }
      });
    });
  },

  get: (username, cb) => {
    db.findOne({ username }, (data) => {
      if (!data) return cb('user not found', {});
      return cb(null, data);
    });
  },

  update: (username, data, cb) => {
    db.updateOne({ username }, data, (res) => {
      if (!res) return cb('no data changed');
      return cb(null);
    });
  },

  updateMany: (query, data, cb) => {
    if (query.groups) {
      query.groups = db.getId(query.groups);
      data.$pull.groups = query.groups;
    }
    db.updateMany(query, data, (res) => {
      if (!res) return cb('no data changed');
      return cb(null);
    });
  },

  delete: (username, cb) => {
    db.findOne({ username }, (doc) => {
      db.removeOne({ username }, (res) => {
        if (!res) return cb('database communication error');

        // This can be changed if/when the user contains their base gallery id
        return galleryModel.get(username.concat('_all'), doc._id.toString(), (error, gallery) => {
          if (error) return cb('database communication error');
          return galleryModel.remove(gallery._id, cb);
        });
      });
    });
  },

  getBaseGallery: (uid, cb) => {
    db.findOne({ _id: db.getId(uid) }, (doc) => {
      if (!doc) {
        cb(null);
      } else {
        cb(doc.gallery);
      }
    });
  }
};
