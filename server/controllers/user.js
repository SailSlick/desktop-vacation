"use strict";
const express = require('express');
const userModel = require('../models/user.js');

module.exports = {
  requireAuth: (req, res, next) =>{
    console.log("yeah i'm sure you're logged in");
    return next();
  },

  login: (req, res, next) => {
    return res.status(200).send('Beep boop logging in');
  },

  logout: (req, res, next) => {
    return res.status(200).send('Beep boop logging out');
  },

  update: (req, res, next) => {
    return res.status(200).send('Beep boop changing user');
  },

  create: (req, res, next) => {
    let username = req.body.username;
    let password = req.body.password;

    let errs = {};

    if (!userModel.verifyUsername(username)) {
      errs.invalid_username = true;
    }
    if (!userModel.verifyPassword(password)) {
      errs.invalid_password = true;
    }

    

    return res.status(200).send('Beep boop creating user');
  },

  delete: (req, res, next) => {
    return res.status(200).send('Beep boop deleting user');
  }
};
