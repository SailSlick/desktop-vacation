const galleryModel = require('../models/gallery');
const userModel = require('../models/user');


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

  switch: (req, res, next) => {
    const uid = req.session.uid;
    const groupname = req.body.groupname;

    galleryModel.get(groupname, uid, (error, doc) => {
      if (error) next({ status: 404, error: 'gallery doesn\'t exist' });

      // add gallery to groups in userdb
      userModel.get(uid, (err, uData) => {
        if (err) next({ status: 500, error: 'switch failed' });
        uData.groups.push(doc._id);
        userModel.update(uid, doc, (ret) => {
          if (ret) next({ status: 500, error: 'switch failed' });
          next({ status: 200, message: 'gallery switched' });
        });
      });
    });
  },

  delete: (req, res, next) => {
    const uid = req.session.uid;
    const groupname = req.body.groupname;

    // check if gallery exists
    galleryModel.get(groupname, uid, (err, doc) => {
      if (err) next({ status: 404, error: 'group doesn\'t exist' });

      if (doc.uid !== uid) {
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

  getGroupList: (req, res, next) => {
    const username = req.session.username;

    // get list from userDB
    userModel.get(username, (err, data) => {
      next({
        status: 200,
        message: 'user groups found',
        data: data.groups
      });
    });
  },

  getInviteList: (req, res, next) => {
    const username = req.session.username;

    // get list from userDB
    userModel.get(username, (err, data) => {
      next({
        status: 200,
        message: 'user groups found',
        data: data.invites
      });
    });
  },

  inviteUser: (req, res, next) => {
    const uid = req.session.uid;
    const groupname = req.body.groupname;
    const toAddName = req.body.username;

    // check to see if user exists
    userModel.get(toAddName, (err, result) => {
      if (err) next({ status: 404, message: 'user doesn\'t exist' });
      // check if gallery exists
      galleryModel.get(groupname, uid, (error, doc) => {
        if (error) next({ status: 404, error: 'group doesn\'t exist' });

        if (doc.uid !== uid) {
          next({ status: 401, error: 'incorrect permissions for group' });
        } else {
          // add invite to user list
          result.invites.push({ groupname, gid: doc._id });
          userModel.update(toAddName, result, (check) => {
            if (check) next({ status: 500, message: 'invite failed' });
            next({ status: 200, message: 'user invited to group' });
          });
        }
      });
    });
  },

  removeUser: (req, res, next) => {
    const uid = req.session.uid;
    const username = req.session.username;
    const groupname = req.body.groupname;
    const toRemoveName = req.body.username;
    const gid = req.body.gid;

    if (username === toRemoveName) {
      next({ status: 400, error: 'user is owner of group' });
    }

    // check to see if user exists
    userModel.get(toRemoveName, (err, result) => {
      if (err) next({ status: 404, message: 'user doesn\'t exist' });

      // update the user's group list
      const userListIndex = result.groups.indexOf(toRemoveName);
      if (userListIndex === -1) {
        next({ status: 400, error: 'user isn\'t member of group' });
      } else {
        result.groups.remove(userListIndex);
        userModel.update(toRemoveName, result, (cb) => {
          if (cb) next({ status: 500, error: cb });
        });
      }

      // check if gallery exists
      galleryModel.get(groupname, gid, (error, doc) => {
        if (error) next({ status: 404, error: 'group doesn\'t exist' });

        if (doc.uid !== uid) {
          next({ status: 401, error: 'incorrect permissions for group' });
        } else {
          // remove user from group
          const groupListIndex = doc.users.indexOf(toRemoveName);
          if (groupListIndex === -1) {
            next({ status: 400, error: 'user isn\'t member of group' });
          } else {
            doc.users.remove(groupListIndex);
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
    });
  },

  join: (req, res, next) => {
    const username = req.session.username;
    const groupname = req.body.groupname;
    const gid = req.body.gid;

    // check to see if user has invite for group
    userModel.get(username, (err, result) => {
      const inviteData = { groupname, gid };
      if (result.invites.indexOf(inviteData) === -1) {
        next({ status: 400, error: 'user isn\'t invited to group' });
      }
      result.groups.push(gid);
      result.invites.remove(result.invites.indexOf(inviteData));
      userModel.update(username, result, (cb) => {
        if (cb) next({ status: 500, error: cb });
      });
    });

    // check if gallery exists
    galleryModel.get(groupname, gid, (err, doc) => {
      if (err) next({ status: 404, error: 'group doesn\'t exist' });

      if (doc.users.indexOf(username) !== -1) {
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
    const username = req.session.username;
    const groupname = req.body.groupname;
    const gid = req.body.gid;

    // check to see if user has invite for group
    userModel.get(username, (err, result) => {
      const inviteData = { groupname, gid };
      if (result.invites.indexOf(inviteData) === -1) {
        next({ status: 400, error: 'invitation doesn\'t exist' });
      }
      result.invites.remove(result.invites.indexOf(inviteData));
      userModel.update(username, result, (cb) => {
        if (cb) next({ status: 500, error: cb });
        next({ status: 200, message: 'user has refused invitation' });
      });
    });
  },

  get: (req, res, next) => {
    const uid = req.session.uid;
    const galleryname = req.body.galleryname;

    galleryModel.get(galleryname, uid, (err, doc) => {
      if (err) next({ status: 404, error: 'gallery doesn\'t exist' });

      next({
        status: 200,
        message: 'gallery found',
        data: doc
      });
    });
  },

  getGroup: (req, res, next) => {
    const username = req.session.username;
    const uid = req.session.uid;
    const groupname = req.body.groupname;
    const gid = req.body.gid;

    galleryModel.get(groupname, gid, (err, doc) => {
      if (err) next({ status: 404, error: 'group doesn\'t exist' });

      if (doc.users.indexOf(username) === -1 || doc.uid !== uid) {
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

  addGroupItem: (req, res, next) => {
    const username = req.session.username;
    const uid = req.session.uid;
    const groupname = req.body.groupname;
    const gid = req.body.gid;
    // const updateData = req.body.updateData;

    galleryModel.get(groupname, gid, (err, doc) => {
      if (!doc) next({ status: 404, error: 'group doesn\'t exist' });
      if (!(doc.uid === uid || doc.user.indexOf(username) !== -1)) {
        next({ status: 400, error: 'user isn\'t member of group' });
      }
      /* Waiting on server syncing
      next({ status: 401, error: 'incorrect permissions for group' });
      next({ status: 400, error: 'data is invalid' });
      next({ status: 200, message: 'data added to group' });
      */
    });
  },

  removeGroupItem: (req, res, next) => {
    const username = req.session.username;
    const uid = req.session.uid;
    const groupname = req.body.groupname;
    const gid = req.body.gid;
    // const updateData = req.body.updateData;

    galleryModel.get(groupname, gid, (err, doc) => {
      if (!doc) next({ status: 404, error: 'group doesn\'t exist' });
      if (!(doc.uid === uid || doc.user.indexOf(username) !== -1)) {
        next({ status: 400, error: 'user isn\'t member of group' });
      }
      /* Waiting on server syncing
      next({ status: 401, error: 'incorrect permissions for group' });
      next({ status: 400, error: 'data is invalid' });
      next({ status: 200, message: 'data removed from group' });
      */
    });
  }
};
