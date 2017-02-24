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
      if (data) return cb('username taken');
      const userData = {
        username,
        password,
        gallery: '',
        invites: [],
        groups: []
      };
      return db.insertOne(userData, (added) => {
        if (added) {
          galleryModel.create(username.concat('_all'), added, (g_id) => {
            userData.gallery = g_id;
            return db.updateOne({ _id: added }, userData, (res) => {
              if (res) return cb();
              return cb('database communication error');
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

  delete: (username, cb) => {
    db.removeOne({ username }, (res) => {
      if (!res) return cb('database communication error');
      return cb(null);
    });
  }
};
