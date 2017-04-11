const galleryModel = require('../models/gallery');
const imageModel = require('../models/image');
const userModel = require('../models/user');
const async = require('async');

// Used by upload and remove to recursively unsync [sub]galleries
function unsync(uid, gid, cb) {
  galleryModel.getGid(gid, (err, gallery) => {
    if (err) return cb(err);
    if (gallery.uid !== uid) return cb('incorrect permissions');

    return async.map(gallery.images,
      (imageId, next) => imageModel.remove(uid, imageId, next),
      (errImg) => {
        // TODO maybe make this more error tolerant
        // ATM if any image/gallery fails to remove the whole process is deemed failed
        // That's fine because you can try again - but we could probably do better
        if (errImg) return cb(errImg);

        return async.map(gallery.subgalleries,
          (galleryId, next) => unsync(uid, galleryId, next),
          (errGal) => {
            if (errGal) return cb(errGal);
            return galleryModel.remove(gid, cb);
          }
        );
      }
    );
  });
}

module.exports = {

  checkGid: (req, res, next) => {
    if (galleryModel.validateGid(req.params.gid).error) {
      res.status(400).json({ status: 400, error: 'invalid gid' });
    } else {
      next();
    }
  },

  // Create/Update
  upload: (req, res, next) => {
    const uid = req.session.uid;
    const gallery = req.body.gallery;

    if (galleryModel.validateGalleryObject(gallery).error) {
      return next({ status: 400, error: 'invalid gallery object' });
    }

    if (uid !== gallery.uid) {
      return next({ status: 401, error: 'uid of gallery does not match user' });
    }

    // Strip remoteId
    const gid = gallery.remoteId;
    delete gallery.remoteId;

    // Update if remoteId was defined
    if (gid) {
      // Check owner first
      return galleryModel.getGid(gid, (err, existingGallery) => {
        if (err) {
          next({ status: 404, error: 'gallery doesn\'t exist' });
        } else if (existingGallery.uid !== uid) {
          next({ status: 403, error: 'incorrect permissions' });
        } else {
          // Remove the images and galleries deleted from the client
          const removedImages = existingGallery.images.filter(oldImage =>
            gallery.images.some(newImage => oldImage === newImage)
          );
          const removedSubgalleries = existingGallery.subgalleries.filter(oldGallery =>
            gallery.galleries.some(newGallery => oldGallery === newGallery)
          );
          async.each(removedImages,
            (id, nextId) => imageModel.remove(uid, id, nextId),
            (errImg) => {
              if (errImg) {
                return next({ status: 500, error: errImg });
              }

              return async.each(removedSubgalleries,
                (id, nextId) => unsync(uid, id, nextId),
                (errGal) => {
                  if (errGal) {
                    return next({ status: 500, error: errGal });
                  }
                  return galleryModel.updateGid(gid, gallery, (error) => {
                    // Gallery won't update if nothing has changed
                    // this shouldn't be a fatal error
                    if (error === 'gallery not updated') {
                      return res.status(200).json({
                        message: error,
                        gid
                      });
                    } else if (error) {
                      return next({ status: 500, error });
                    }
                    return res.status(200).json({ message: 'gallery updated', gid });
                  });
                });
            }
          );
        }
      });
    }

    // Insert otherwise
    return userModel.getBaseGallery(uid, baseGalleryId =>
      galleryModel.insert(gallery, baseGalleryId, (error, newId) => {
        if (error) next({ status: 500, error });
        else res.status(200).json({ message: 'gallery uploaded', gid: newId });
      })
    );
  },

  // Read
  get: (req, res, next) => {
    const uid = req.session.uid;
    const gid = req.params.gid;

    return galleryModel.getGid(gid, (err, gallery) => {
      if (err) return next({ status: 404, error: 'gallery doesn\'t exist' });

      if (gallery.uid !== uid) {
        return next({ status: 403, error: 'incorrect permissions' });
      }

      // Rename _id to remoteId
      gallery.remoteId = gallery._id;
      delete gallery._id;

      return next({
        status: 200,
        message: 'gallery found',
        data: gallery
      });
    });
  },

  // Delete
  remove: (req, res, next) => {
    const uid = req.session.uid;
    const gid = req.params.gid;

    return unsync(uid, gid, (error) => {
      if (error === 'incorrect permissions') return next({ status: 403, error });
      if (error) return next({ status: 500, error });
      return res.status(200).json({ message: 'gallery removed' });
    });
  },

  createGroup: (req, res, next) => {
    const uid = req.session.uid;
    const username = req.session.username;
    const groupname = req.body.groupname;

    if (galleryModel.validateGalleryName(groupname).error) {
      return next({ status: 400, error: 'invalid groupname' });
    }

    return userModel.getBaseGallery(uid, baseGalleryId => (
      galleryModel.create(groupname, baseGalleryId, uid, (errStatus, ret) => {
        if (errStatus) {
          return next({ status: errStatus, error: ret });
        }
        return galleryModel.get(groupname, uid, (cb, doc) => {
          userModel.get(username, (err, data) => {
            if (err) return next({ status: 500, message: 'creation failed' });
            data.groups.push(doc._id);
            return userModel.update(username, data, () => {
              next({ status: 200, message: 'group created', gid: doc._id });
            });
          });
        });
      })
    ));
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

    if (galleryModel.validateGid(gid).error) {
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
      return galleryModel.remove(gid, (error) => {
        if (error) {
          return next({ status: 500, error });
        }
        // remove from all users.
        return userModel.updateMany({ groups: gid }, { $pull: { groups: gid } }, () => {
          next({ status: 200, message: 'gallery removed' });
        });
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
            images: [],
            metadata: gallery.metadata
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
    let imageIds = req.body['image-ids'];

    // Decode the imageIds
    if (typeof imageIds === 'string') imageIds = JSON.parse(imageIds);
    galleryModel.getGid(gid, (err, doc) => {
      if (!doc) return next({ status: 404, error: 'group doesn\'t exist' });
      if (!(doc.uid === uid || doc.users.indexOf(username) !== -1)) {
        return next(400, 'user isn\'t member of group');
      }
      return async.each(imageIds,
        (id, nextId) => {
          imageModel.get(id, (getErr, image) => {
            if (getErr) nextId(400, 'data is invalid');
            else if (uid !== image.uid) {
              nextId(401, 'incorrect permissions for image');
            }
            galleryModel.addImages(gid, [id], (failure) => {
              if (failure) nextId(500, failure);
              else {
                imageModel.incrementRef(id, (incErr) => {
                  if (incErr) console.error(incErr);
                  nextId(null, 'data added to group');
                });
              }
            });
          });
        }, (error, message) => {
          if (error) return next({ status: error, error: message });
          return next({ status: 200, message });
        });
    });
  },

  removeGroupItem: (req, res, next) => {
    const username = req.session.username;
    const uid = req.session.uid;
    const gid = req.params.gid;
    const imageIds = req.body['image-ids'];

    galleryModel.getGid(gid, (err, doc) => {
      if (!doc) return next({ status: 404, error: 'group doesn\'t exist' });
      if (!(doc.uid === uid || doc.user.indexOf(username) !== -1)) {
        return next(400, 'user isn\'t member of group');
      }
      return async.each(imageIds,
        (id, nextId) => {
          imageModel.get(id, (getErr, image) => {
            if (getErr) nextId(400, 'data is invalid');
            else if (uid !== image.uid) {
              nextId(401, 'incorrect permissions for image');
            }
            galleryModel.addImages(gid, id, (failure) => {
              if (failure) nextId(500, failure);
              else {
                imageModel.incrementRef(id, (incErr) => {
                  if (incErr) console.error(incErr);
                  nextId(null, 'data added to group');
                });
              }
            });
          });
        }, (error, message) => {
          if (error) return next({ status: error, error: message });
          return next({ status: 200, message });
        });
    });
  }
};
