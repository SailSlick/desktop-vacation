const galleryModel = require('../models/gallery');

module.exports = {

  create: (req, res, next) => {
    const username = req.session.username;
    const groupname = req.body.groupname;

    
  },

  delete: (req, res, next) => {
    const username = req.session.username;
    const groupname = req.body.groupname;
  },

  getList: (req, res, next) => {

  },

  inviteUser: (req, res, next) => {
    const username = req.session.username;
    const toAddName = req.body.username;
  },

  removeUser: (req, res, next) => {
    const username = req.session.username;
    const toRemoveName = req.body.username;
  },

  join: (req, res, next) => {
    const username = req.session.username;
    const groupname = req.body.groupname;
  },

  refuse: (req, res, next) => {
    const username = req.session.username;
    const groupname = req.body.groupname;
  },

  get: (req, res, next) => {
    const username = req.session.username;
    const groupname = req.body.groupname;
  },

  addItem: (req, res, next) => {
    const username = req.session.username;
    const groupname = req.body.groupname;
    const groupdata = req.body.groupdata;
  },

  removeItem: (req, res, next) => {
    const username = req.session.username;
    const groupname = req.body.groupname;
    const groupdata = req.body.groupdata;
  }
};
