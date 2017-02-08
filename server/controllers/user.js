"use strict";
const express = require('express');
const bcrypt = require('bcrypt');
const userModel = require('../models/user.js');

const SALT_N = 8;

module.exports = {
  requireAuth: (req, res, next) =>{
    if (req.session.username) return next();
    return next({status: 401, error: "not logged in"});
  },

  login: (req, res, next) => {
    let username = req.body.username;
    let password = req.body.password;

    userModel.get(username, (data, err) => {
      if (err) return next({status: 500, error: err});
      if (! password in data) return next({status: 400, error: "no user found"});

      bcrypt.compare(password, data.password, (err, correct) => {
        if (err) return next(error, 500);
        if (correct) {
          req.session.username = username;
          return res.status(200).json({message: "user logged in."});
        }
        return next({status: 400, error: "invalid password"});
      });
    });
  },

  logout: (req, res, next) => {
    req.session.destroy( err => {
      return res.status(200).json({message: "user logged out"});
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
      return next({status: 400, errir: err});
    }

    bcrypt.hash(password, SALT_N, (err, hash) => {
      if (err) return next({status: 500, error: err});
      userModel.add(username, hash, err => {
        if (err) return next({status: 400, error: err});
        req.session.username = username;
        return res.status(200).json({message: "user created and logged in"});
      });
    });
  },

  delete: (req, res, next) => {
    userModel.delete(req.session.username, (err) => {
      if (err) return next({status: 500, error: err});
      return res.status(200).json({message: "user deleted"});
    });
  }
};
