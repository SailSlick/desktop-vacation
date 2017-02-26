const galleryModel = require('../models/gallery');
const userModel = require('../models/user');


module.exports = {

  create: (req, res, next) => {
    const uid = req.session.uid;
    const username = req.session.username;
    const groupname = req.body.groupname;

    if (!galleryModel.verGroupname(groupname)) {
      return next({ status: 400, error: 'invalid groupname' });
    }
    return galleryModel.create(groupname, uid, (ret) => {
      if (ret === 'user already has db of that name') {
        return next({ status: 400, error: ret });
      } else if (ret === 'gallery could not be inserted') {
        return next({ status: 403, error: ret });
      } else if (isNaN(ret)) {
        return galleryModel.get(groupname, uid, (cb, doc) => {
          userModel.get(username, (err, data) => {
            if (err) return next({ status: 500, message: 'creation failed' });
            data.groups.push(doc._id);
            return userModel.update(username, data, () => {
              next({ status: 200, message: 'group created' });
            });
          });
        });
      }
      return next({ status: 500, message: 'creation failed' });
    });
  },

  switch: (req, res, next) => {
    const uid = req.session.uid;
    const groupname = req.body.groupname;

    galleryModel.get(groupname, uid, (error, doc) => {
      if (error) return next({ status: 404, error: 'gallery doesn\'t exist' });

      // add gallery to groups in userdb
      return userModel.get(uid, (err, uData) => {
        if (err) return next({ status: 500, error: 'switch failed' });
        uData.groups.push(doc.id);
        return userModel.update(uid, doc, (ret) => {
          if (ret) return next({ status: 500, error: 'switch failed' });
          return next({ status: 200, message: 'gallery switched' });
        });
      });
    });
  },

  delete: (req, res, next) => {
    const uid = req.session.uid;
    const gid = req.body.gid;

    // check if gallery exists
    return galleryModel.getGid(gid, (err, doc) => {
      if (err) {
        console.error(err);
        return next({ status: 404, error: 'group doesn\'t exist' });
      }
      if (doc.uid !== uid) {
        return next({ status: 401, error: 'incorrect permissions for group' });
      }
      return galleryModel.remove(doc.name, uid, (ret) => {
        if (ret === 'gallery deleted') {
          return next({ status: 200, message: ret });
        }
        return next({ status: 500, error: ret });
      });
    });
  },

  getGroupList: (req, res, next) => {
    const username = req.session.username;

    // get list from userDB
    return userModel.get(username, (err, data) => {
      console.error('control glist:', data.groups);
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
    return userModel.get(username, (err, data) => {
      next({
        status: 200,
        message: 'user groups found',
        data: data.invites
      });
    });
  },

  inviteUser: (req, res, next) => {
    const uid = req.session.uid;
    const toAddName = req.body.username;
    const gid = req.body.gid;

    // check to see if user exists
    return userModel.get(toAddName, (err, result) => {
      if (err) return next({ status: 404, message: 'user doesn\'t exist' });
      // check if gallery exists
      return galleryModel.getGid(gid, (error, doc) => {
        if (error) return next({ status: 404, error: 'group doesn\'t exist' });

        if (doc.uid !== uid) {
          return next({ status: 401, error: 'incorrect permissions for group' });
        }
        // add invite to user list
        result.invites.push({ groupname: doc.name, gid: doc.id });
        return userModel.update(toAddName, result, (check) => {
          if (check) return next({ status: 500, message: 'invite failed' });
          return next({ status: 200, message: 'user invited to group' });
        });
      });
    });
  },

  removeUser: (req, res, next) => {
    const uid = req.session.uid;
    const username = req.session.username;
    const toRemoveName = req.body.username;
    const gid = req.body.gid;

    if (username === toRemoveName) {
      return next({ status: 400, error: 'user is owner of group' });
    }

    // check to see if user exists
    return userModel.get(toRemoveName, (err, result) => {
      if (err) return next({ status: 404, message: 'user doesn\'t exist' });

      // update the user's group list
      const userListIndex = result.groups.indexOf(toRemoveName);
      if (userListIndex === -1) {
        return next({ status: 400, error: 'user isn\'t member of group' });
      }
      result.groups.remove(userListIndex);
      return userModel.update(toRemoveName, result, (cb) => {
        if (cb) return next({ status: 500, error: cb });
        // check if gallery exists
        return galleryModel.getGid(gid, (error, doc) => {
          if (error) return next({ status: 404, error: 'group doesn\'t exist' });

          if (doc.uid !== uid) {
            return next({ status: 401, error: 'incorrect permissions for group' });
          }
          // remove user from group
          const groupListIndex = doc.users.indexOf(toRemoveName);
          if (groupListIndex === -1) {
            return next({ status: 400, error: 'user isn\'t member of group' });
          }
          doc.users.remove(groupListIndex);
          return galleryModel.update(doc.name, uid, doc, (ret) => {
            if (ret === 'updated one gallery') {
              return next({ status: 200, message: 'user removed from group' });
            }
            return next({ status: 500, error: ret });
          });
        });
      });
    });
  },

  join: (req, res, next) => {
    const username = req.session.username;
    const groupname = req.body.groupname;
    const gid = req.body.gid;

    // check to see if user has invite for group
    return userModel.get(username, (err, result) => {
      const inviteData = { groupname, gid };
      if (result.invites.indexOf(inviteData) === -1) {
        return next({ status: 400, error: 'user isn\'t invited to group' });
      }
      result.groups.push(gid);
      result.invites.remove(result.invites.indexOf(inviteData));
      return userModel.update(username, result, (cb) => {
        if (cb) return next({ status: 500, error: cb });
        // check if gallery exists
        return galleryModel.getGid(gid, (err2, doc) => {
          if (err2) return next({ status: 404, error: 'group doesn\'t exist' });

          if (doc.users.indexOf(username) !== -1) {
            return next({ status: 401, error: 'user is already member of group' });
          }
          doc.users.push(username);
          return galleryModel.update(groupname, doc.uid, doc, (ret) => {
            if (ret === 'updated one gallery') {
              return next({ status: 200, message: 'user has joined the group' });
            }
            return next({ status: 500, error: ret });
          });
        });
      });
    });
  },

  refuse: (req, res, next) => {
    const username = req.session.username;
    const groupname = req.body.groupname;
    const gid = req.body.gid;

    // check to see if user has invite for group
    return userModel.get(username, (err, result) => {
      const inviteData = { groupname, gid };
      if (result.invites.indexOf(inviteData) === -1) {
        return next({ status: 400, error: 'invitation doesn\'t exist' });
      }
      result.invites.remove(result.invites.indexOf(inviteData));
      return userModel.update(username, result, (cb) => {
        if (cb) return next({ status: 500, error: cb });
        return next({ status: 200, message: 'user has refused invitation' });
      });
    });
  },

  get: (req, res, next) => {
    const uid = req.session.uid;
    const galleryname = req.body.galleryname;

    galleryModel.get(galleryname, uid, (err, doc) => {
      if (err) return next({ status: 404, error: 'gallery doesn\'t exist' });
      return next({
        status: 200,
        message: 'gallery found',
        data: doc
      });
    });
  },

  getGroup: (req, res, next) => {
    const username = req.session.username;
    const uid = req.session.uid;
    const gid = req.body.gid;

    galleryModel.getGid(gid, (err, doc) => {
      if (err) return next({ status: 404, error: 'group doesn\'t exist' });

      if (doc.users.indexOf(username) === -1 || doc.uid !== uid) {
        return next({ status: 400, error: 'user isn\'t member of group' });
      }
      return next({
        status: 200,
        message: 'group found',
        data: doc
      });
    });
  },

  addGroupItem: (req, res, next) => {
    const username = req.session.username;
    const uid = req.session.uid;
    const gid = req.body.gid;
    // const updateData = req.body.updateData;

    galleryModel.getGid(gid, (err, doc) => {
      if (!doc) return next({ status: 404, error: 'group doesn\'t exist' });
      if (!(doc.uid === uid || doc.user.indexOf(username) !== -1)) {
        return next({ status: 400, error: 'user isn\'t member of group' });
      }
      return next();
      /* Waiting on server syncing
      return next({ status: 401, error: 'incorrect permissions for group' });
      return next({ status: 400, error: 'data is invalid' });
      return next({ status: 200, message: 'data added to group' });
      */
    });
  },

  removeGroupItem: (req, res, next) => {
    const username = req.session.username;
    const uid = req.session.uid;
    const gid = req.body.gid;
    // const updateData = req.body.updateData;

    galleryModel.getGid(gid, (err, doc) => {
      if (!doc) return next({ status: 404, error: 'group doesn\'t exist' });
      if (!(doc.uid === uid || doc.user.indexOf(username) !== -1)) {
        return next({ status: 400, error: 'user isn\'t member of group' });
      }
      return next();
      /* Waiting on server syncing
      return next({ status: 401, error: 'incorrect permissions for group' });
      return next({ status: 400, error: 'data is invalid' });
      return next({ status: 200, message: 'data removed from group' });
      */
    });
  }
};
