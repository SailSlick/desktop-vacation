const galleryModel = require('../models/gallery');
const userModel = require('../models/user');
const async = require('async');

module.exports = {

  createGroup: (req, res, next) => {
    const uid = req.session.uid;
    const username = req.session.username;
    const groupname = req.body.groupname;

    if (!galleryModel.verifyGroupname(groupname)) {
      return next({ status: 400, error: 'invalid groupname' });
    }
    return userModel.getBaseGallery(uid, (_, baseGalleryId) =>
      galleryModel.create(groupname, baseGalleryId, uid, (ret) => {
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
                next({ status: 200, message: 'group created', gid: doc._id });
              });
            });
          });
        }
        return next({ status: 500, message: 'creation failed' });
      })
    );
  },

  create: (req, res, next) => {
    const uid = req.session.uid;
    const galleryname = req.body.galleryname;

    if (!galleryModel.verifyGroupname(galleryname)) {
      return next({ status: 400, error: 'invalid groupname' });
    }
    return userModel.getBaseGallery(uid, (_, baseGalleryId) => {
      galleryModel.create(galleryname, baseGalleryId, uid, (ret) => {
        if (ret === 'user already has db of that name') {
          return next({ status: 400, error: ret });
        } else if (ret === 'gallery could not be inserted') {
          return next({ status: 403, error: ret });
        } else if (isNaN(ret)) {
          return res.status(200).json({ message: 'gallery created', gid: ret });
        }
        return next({ status: 500, message: 'creation failed' });
      });
    });
  },

  convert: (req, res, next) => {
    const uid = req.session.uid;
    const groupname = req.body.groupname;

    galleryModel.get(groupname, uid, (error, doc) => {
      if (error) return next({ status: 404, error: 'gallery doesn\'t exist' });

      // add gallery to groups in userdb
      return userModel.get(uid, (err, uData) => {
        if (err) return next({ status: 500, error: 'convert failed' });
        uData.groups.push(doc._id);
        return userModel.update(uid, doc, (ret) => {
          if (ret) return next({ status: 500, error: 'convert failed' });
          return next({ status: 200, message: 'gallery converted' });
        });
      });
    });
  },

  deleteGroup: (req, res, next) => {
    const uid = req.session.uid;
    const gid = req.body.gid;

    if (!galleryModel.verifyGid(gid)) {
      return next({ status: 400, error: 'invalid gid' });
    }

    // check if gallery exists
    return galleryModel.getGid(gid, (err, doc) => {
      if (err) {
        return next({ status: 404, error: 'group doesn\'t exist' });
      }
      if (doc.uid !== uid) {
        return next({ status: 401, error: 'incorrect permissions for group' });
      }
      return galleryModel.remove(doc.name, uid, (ret) => {
        if (ret === 'gallery deleted') {
          // remove from all users.
          return userModel.updateMany({ groups: gid }, { $pull: { groups: gid } }, () => {
            next({ status: 200, message: ret });
          });
        }
        return next({ status: 500, error: ret });
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
      if (err) return next({ status: 404, error: 'user doesn\'t exist' });
      // check if gallery exists
      return galleryModel.getGid(gid, (error, doc) => {
        if (error) return next({ status: 404, error: 'group doesn\'t exist' });

        if (doc.uid !== uid) {
          return next({ status: 401, error: 'incorrect permissions for group' });
        }
        if (doc.users.indexOf(toAddName) !== -1) {
          return next({ status: 400, error: 'user is already member of group' });
        }
        // add invite to user list
        result.invites.push({ groupname: doc.name, gid: doc._id.toHexString() });
        return userModel.update(toAddName, result, (check) => {
          if (check) return next({ status: 500, error: 'invite failed' });
          return next({ status: 200, message: 'user invited to group' });
        });
      });
    });
  },

  removeUser: (req, res, next) => {
    const uid = req.session.uid;
    const toRemoveName = req.body.username;
    const gid = req.body.gid;

    // check to see if user exists
    return userModel.get(toRemoveName, (err, result) => {
      if (err) return next({ status: 404, error: 'user doesn\'t exist' });

      // check if gallery exists
      return galleryModel.getGid(gid, (error, doc) => {
        if (error) return next({ status: 404, error: 'group doesn\'t exist' });
        if (!(doc.uid === uid || result._id.toHexString() === uid)) {
          return next({ status: 401, error: 'incorrect permissions for group' });
        }
        if (doc.uid === result._id.toHexString()) {
          return next({ status: 400, error: 'user is owner of group' });
        }

        // check user group list for the group id
        let found = false;
        result.groups.forEach((group, index) => {
          if (typeof group !== 'string') group = group.toHexString();
          if (group === gid) {
            result.groups.splice(index, 1);
            found = true;
          }
        });
        if (!found) return next({ status: 400, error: 'user isn\'t member of group' });
        return userModel.update(toRemoveName, result, (cb) => {
          if (cb) return next({ status: 500, error: cb });

          // remove group from user groups
          const groupListIndex = doc.users.indexOf(toRemoveName);
          if (groupListIndex === -1) {
            return next({ status: 400, error: 'user isn\'t member of group' });
          }
          doc.users.splice(groupListIndex, 1);
          return galleryModel.update(doc.name, doc.uid, doc, (ret) => {
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
      let in_check = false;
      result.invites.forEach((invite, index) => {
        if (invite.groupname === groupname && invite.gid === gid) {
          result.groups.push(gid);
          result.invites.splice(index, 1);
          in_check = true;
        }
      });

      return galleryModel.getGid(gid, (err2, doc) => {
        if (err2) return next({ status: 404, error: 'group doesn\'t exist' });
        if (!in_check) return next({ status: 400, error: 'user isn\'t invited to group' });
        return userModel.update(username, result, (cb) => {
          if (cb) return next({ status: 500, error: cb });
          // check if gallery exists

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
      let in_check = false;
      result.invites.forEach((invite, index) => {
        if (invite.groupname === groupname && invite.gid === gid) {
          result.invites.splice(index, 1);
          in_check = true;
        }
      });
      if (!in_check) return next({ status: 404, error: 'invitation doesn\'t exist' });
      return userModel.update(username, result, (cb) => {
        if (cb) return next({ status: 500, error: cb });
        return next({ status: 200, message: 'user has refused invitation' });
      });
    });
  },

  get: (req, res, next) => {
    const uid = req.session.uid;
    const gid = req.params.gid;

    if (!galleryModel.verifyGid(gid)) {
      return next({ status: 400, error: 'invalid gid' });
    }
    return galleryModel.getGid(gid, (err, doc) => {
      if (err) return next({ status: 404, error: 'gallery doesn\'t exist' });

      if (doc.uid !== uid) {
        return next({ status: 400, error: 'incorrect permissions' });
      }

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
    const gid = req.params.gid;

    return galleryModel.getGid(gid, (err, doc) => {
      if (err) {
        return next({ status: 404, error: 'group doesn\'t exist' });
      }
      if (doc.uid !== uid && doc.users.indexOf(username) === -1) {
        return next({ status: 400, error: 'user isn\'t member of group' });
      }
      return next({
        status: 200,
        message: 'group found',
        data: doc
      });
    });
  },

  getGroupList: (req, res, next) => {
    const username = req.session.username;

    // get list from userDB
    return userModel.get(username, (err, data) => {
      if (err) {
        return next({
          status: 500,
          error: 'failed to get user'
        });
      }
      return async.map(data.groups, (gid, cb) => {
        galleryModel.getGid(gid, (map_err, gallery) => {
          if (map_err === 'gallery not found') return cb(null, {});
          if (map_err) return cb(map_err, {});
          return cb(null, {
            _id: gallery._id,
            name: gallery.name,
            uid: gallery.uid,
            users: gallery.users,
            images: []
          });
        });
      }, (map_err, galleries) => {
        if (map_err === 'gallery not found') {
          galleries = galleries.filter(x => x !== {});
          return next({
            status: 200,
            message: 'user groups found',
            data: {
              subgalleries: galleries,
              images: []
            }
          });
        } else if (map_err) {
          return next({
            status: 500,
            error: 'failed to get group list'
          });
        }
        return next({
          status: 200,
          message: 'user groups found',
          data: {
            subgalleries: galleries,
            images: []
          }
        });
      });
    });
  },

  addGroupItem: (req, res, next) => {
    const username = req.session.username;
    const uid = req.session.uid;
    const gid = req.params.gid;
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
    const gid = req.params.gid;
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
