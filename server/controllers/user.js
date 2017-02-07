"use strict";
const express = require('express');
const bcrypt = require('bcrypt');
const userModel = require('../models/user.js');

const SALT_N = 8;

module.exports = {
  requireAuth: (req, res, next) =>{
    if (req.session.username) return next();
    return res.status(401).send("YER NOT LOGGED IN");
  },

  login: (req, res, next) => {
    let username = req.body.username;
    let password = req.body.password;

    userModel.get(username, (data, err) => {
      if (err) return next(err, 400);
      if (! password in data) return next("invalid user", 400);

      bcrypt.compare(password, data.password, (err, correct) => {
        if (err) return next(err, 500);
        if (correct) {
          req.session.username = username;
          return res.status(200).send("logged in!");
        }
        return next("invalid password", 400);
      });
    });
  },

  logout: (req, res, next) => {
    req.session.destroy( err => {
      return res.status(200).send('logged out');
    });
  },

  update: (req, res, next) => {
    return res.status(200).send('Beep boop changing user');
  },

  create: (req, res, next) => {
    let username = req.body.username;
    let password = req.body.password;

    let error = "";
    if (!userModel.verifyUsername(username)) {
      error = error.concat("invalid username");
    }
    if (!userModel.verifyPassword(password)) {
      if (error.length != 0) error.concat(" and ");
      err = error.concat("invalid password.");
    }
    if (error.length != 0) {
      return next(err, 400);
    }

    bcrypt.hash(password, SALT_N, (err, hash) => {
      if (err) return next(err, 500);
      userModel.add(username, hash, err => {
        if (err) return next(err, 400);
        req.session.username = username;
        return res.status(200).send("logged in");
      });
    });
  },

  delete: (req, res, next) => {
    return res.status(200).send('Beep boop deleting user');
  }
};
