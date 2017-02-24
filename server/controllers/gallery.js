const galleryModel = require('../models/gallery');

module.exports = {

  create: (req, res, next) => {
    const uid = req.session.uid;
    const groupname = req.body.groupname;

    if (groupname.length > 20) {
      next({ status: 400, error: 'invalid groupname' });
    }

    galleryModel.create(groupname, uid, (ret) => {
      if (ret === 'user already has db of that name') {
        next({ status: 400, error: ret });
      } else if (ret === 'gallery could not be inserted') {
        next({ status: 400, error: ret });
      } else if (!isNaN(ret)) {
        next({ status: 200, message: 'group created' });
      } else {
        next({ status: 500, message: 'creation failed' });
      }
    });
  },

  delete: (req, res, next) => {
    const uid = req.session.uid;
    const groupname = req.body.groupname;

    // check if gallery exists
    galleryModel.get(groupname, uid, (doc) => {
      if (doc === 'gallery not found') {
        next({ status: 404, error: 'group doesn\'t exist' });
      } else if (doc.uid !== uid) {
        next({ status: 401, error: 'incorrect permissions for group' });
      } else {
        galleryModel.remove(groupname, uid, (ret) => {
          if (ret === 'gallery deleted') {
            next({ status: 200, message: ret });
          } else {
            next({ status: 500, error: ret });
          }
        });
      }
    });
  },

  inviteUser: (req, res, next) => {
    const uid = req.session.uid;
    const groupname = req.body.groupname;
    const toAddName = req.body.username;

    // add check to see if user exists
    // next({ status: 404, message: 'user doesn\'t exist' });

    // check if gallery exists
    galleryModel.get(groupname, uid, (doc) => {
      if (doc === 'gallery not found') {
        next({ status: 404, error: 'group doesn\'t exist' });
      } else if (doc.uid !== uid) {
        next({ status: 401, error: 'incorrect permissions for group' });
      } else {
        // add invite to user list
        // next({ status: 200, message: 'user invited to group' });
      }
    });
  },

  removeUser: (req, res, next) => {
    const uid = req.session.uid;
    const username = req.session.username;
    const groupname = req.body.groupname;
    const toRemoveName = req.body.username;

    // add check to see if user exists
    // next({ status: 404, message: 'user doesn\'t exist' });
    if (username === toRemoveName) {
      next({ status: 400, error: 'user is owner of group' });
    }

    // check if gallery exists
    galleryModel.get(groupname, uid, (doc) => {
      if (doc === 'gallery not found') {
        next({ status: 404, error: 'group doesn\'t exist' });
      } else if (doc.uid !== uid) {
        next({ status: 401, error: 'incorrect permissions for group' });
      } else {
        // remove user from group
        const userListIndex = doc.users.indexOf(toRemoveName);
        if (userListIndex === -1) {
          next({ status: 400, error: 'user isn\'t member of group' });
        } else {
          doc.users.remove(userListIndex);
          galleryModel.update(groupname, uid, doc, (ret) => {
            if (ret === 'updated one gallery') {
              next({ status: 200, message: 'user removed from group' });
            } else {
              next({ status: 500, error: ret });
            }
          });
        }
      }
    });
  },

  join: (req, res, next) => {
    const uid = req.session.uid;
    const username = req.session.username;
    const groupname = req.body.groupname;

    // check if user has invite for group
    // next({ status: 400, error: 'user isn\'t invited to group' });

    // check if gallery exists
    galleryModel.get(groupname, uid, (doc) => {
      if (doc === 'gallery not found') {
        next({ status: 404, error: 'group doesn\'t exist' });
      } else if (doc.users.indexOf(username) !== -1) {
        next({ status: 401, error: 'user is already member of group' });
      } else {
        doc.users.push(username);
        galleryModel.update(groupname, doc.uid, doc, (ret) => {
          if (ret === 'updated one gallery') {
            next({ status: 200, message: 'user has joined the group' });
          } else {
            next({ status: 500, error: ret });
          }
        });
      }
    });
  },

  refuse: (req, res, next) => {
    const uid = req.session.uid;
    const username = req.session.username;
    const groupname = req.body.groupname;

    // check if user has invite for group
    // next({ status: 400, error: 'invitation doesn\'t exist' });
    // next({ status: 200, message: 'user has refused invitation' });
  },

  get: (req, res, next) => {
    const uid = req.session.uid;
    const username = req.session.username;
    const groupname = req.body.groupname;

    galleryModel.get(groupname, uid, (doc) => {
      if (doc === 'gallery not found') {
        next({ status: 404, error: 'group doesn\'t exist' });
      } else if (doc.users.indexOf(username) === -1) {
        next({ status: 400, error: 'user isn\'t member of group' });
      } else {
        next({
          status: 200,
          message: 'group found',
          data: doc
        });
      }
    });
  },

  addItem: (req, res, next) => {
    /* Waiting on server syncing
    next({ status: 404, error: 'group doesn\'t exist' });
    next({ status: 400, error: 'user isn\'t member of group' });
    next({ status: 401, error: 'incorrect permissions for group' });
    next({ status: 400, error: 'data is invalid' });
    next({ status: 200, message: 'data added to group' });
    */
    next();
  },

  removeItem: (req, res, next) => {
    /* Waiting on server syncing
    next({ status: 404, error: 'group doesn\'t exist' });
    next({ status: 400, error: 'user isn\'t member of group' });
    next({ status: 401, error: 'incorrect permissions for group' });
    next({ status: 400, error: 'data is invalid' });
    next({ status: 200, message: 'data removed from group' });
    */
    next();
  }
};
