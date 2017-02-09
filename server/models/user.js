const db = {}; // totally a db

module.exports = {
  verifyPassword: password =>
    typeof password === 'string' && password.length > 6 && password.length < 256,

  verifyUsername: username =>
    typeof username === 'string' && username.indexOf(' ') === -1,

  add: (username, hash, cb) => {
    if (username in db) {
      return cb('username taken.');
    }
    db[username] = hash;
    return cb();
  },

  get: (username, cb) => {
    if (username in db) {
      const p = db[username];
      const d = {
        password: p
      };
      return cb(d);
    }
    return cb();
  },

  update: (username, password, cb) => {
    db[username] = password;
    return cb();
  },

  delete: (username, cb) => {
    if (!(username in db)) return cb('username not found.'); // XXX
    delete db[username];
    return cb();
  }
};
