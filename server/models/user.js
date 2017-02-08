"use strict";
const db = {}; //totally a db

module.exports = {
  verifyPassword: (password) => {
    return typeof password === 'string' && password.length > 6 && password.length < 256;
  },

  verifyUsername: (username) => {
    return typeof username === 'string' && username.indexOf(' ') == -1;
  },

  add: (username, hash, cb) => {
    if (username in db) {
      return cb("username taken.");
    }
    db[username] = hash;
    cb();
  },

  get: (username, cb) => {
    if (username in db) {
      let p = db[username];
      let d = {
        password: p
      };
      return cb(d);
    }
    return cb({});
  },

  delete: (username, cb) => {
    if (! username in db) return cb("username not found.")
    delete db[username];
    cb();
  }
};
