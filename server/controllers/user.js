const bcrypt = require('bcrypt');
const userModel = require('../models/user.js');

const SALT_N = 8;

module.exports = {
  requireAuth: (req, res, next) => {
    if (req.session.username) return next();
    return next({ status: 401, error: 'not logged in' });
  },

  login: (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;

    userModel.get(username, (data, err) => {
      if (err) return next({ status: 500, error: err });
      if (!data) return next({ status: 401, error: 'incorrect credentials' }); // XXX

      return bcrypt.compare(password, data.password, (bcrypt_err, correct) => {
        if (err) return next({ status: 500, error: bcrypt_err });
        if (correct) {
          req.session.username = username;
          return res.status(200).json({ message: 'user logged in' });
        }
        return next({ status: 401, error: 'incorrect credentials' });
      });
    });
  },

  logout: (req, res, next) => {
    req.session.destroy((err) => {
      if (err) return next({ status: 500, message: err });
      return res.status(200).json({ message: 'user logged out' });
    });
  },

  update: (req, res, next) => {
    const password = req.body.password;

    // XXX: since password is the only current option changed, just check that
    // Will likely be replaced by null checks
    if (!userModel.verifyPassword(password)) {
      return next({ status: 400, error: 'invalid password' });
    }
    return userModel.update(req.session.username, req.body, (err) => {
      if (err) return next({ status: 500, error: err });
      return res.status(200).json({ message: 'user updated' });
    });
  },

  create: (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;

    let create_err = '';
    if (!userModel.verifyUsername(username)) {
      create_err = create_err.concat('invalid username');
    }
    if (!userModel.verifyPassword(password)) {
      if (create_err.length !== 0) create_err.concat(' and ');
      create_err = create_err.concat('invalid password.');
    }
    if (create_err.length !== 0) {
      return next({ status: 400, error: create_err });
    }

    return bcrypt.hash(password, SALT_N, (err, hash) => {
      if (err) return next({ status: 500, error: err });
      return userModel.add(username, hash, (add_err) => {
        if (add_err) return next({ status: 400, error: add_err });
        req.session.username = username;
        return res.status(200).json({ message: 'user created and logged in' });
      });
    });
  },

  delete: (req, res, next) => {
    userModel.delete(req.session.username, (err) => {
      if (err) return next({ status: 500, error: err });
      return res.status(200).json({ message: 'user deleted' });
    });
  }
};
