const async = require('async');
const DBTools = require('../middleware/db');

const db = new DBTools('galleries');

module.exports = {
  verifyGalleryName: galleryName =>
    typeof galleryName === 'string' && galleryName.length > 0,

  verGroupname: groupname =>
    typeof groupname === 'string' && groupname.length <= 20 && groupname.length >= 3,

  verGid: gid => typeof gid === 'string' && gid.length === 24,

  create: (galleryname, baseGalleryId, uid, cb) => {
    console.log(galleryname, baseGalleryId, uid, cb);
    db.findOne({ name: galleryname, uid }, (doc) => {
      if (doc) return cb('user already has db of that name');
      const galleryData = {
        name: galleryname,
        uid,
        users: [],
        tags: [],
        subgallaries: [],
        images: []
      };
      return db.insertOne(galleryData, (res) => {
        if (!res) {
          return cb('gallery could not be inserted');
        } else if (baseGalleryId === null || baseGalleryId === res) {
          return cb(res);
        }
        return db.col.updateOne(
        { _id: baseGalleryId, uid },
        { $addToSet: { subgallaries: res.toString() } },
        (baseGallery) => {
          console.log(baseGallery);
          return cb(res);
        });
      });
    });
  },

  get: (galleryname, uid, cb) => {
    db.findOne({ name: galleryname, uid }, (doc) => {
      if (doc) return cb(null, doc);
      return cb('gallery not found', null);
    });
  },

  getGid: (gid, cb) => {
    db.findOne({ _id: gid }, (doc) => {
      if (doc) return cb(null, doc);
      return cb('gallery not found', null);
    });
  },

  remove: (galleryname, uid, cb) => {
    db.removeOne({ name: galleryname, uid }, (res) => {
      if (res) return cb('gallery deleted');
      return cb('deletion failed');
    });
  },

  update: (galleryname, uid, data, cb) => {
    db.updateOne({ name: galleryname, uid }, data, (res) => {
      if (res) return cb('updated one gallery');
      return cb('gallery not updated');
    });
  },

  addImages: (gid, baseGalleryId, uid, imageIds, next) => {
    if (imageIds.length === 0) {
       // Since duplicate images aren't passed to the base gallery call, dont
       // error on empty imageIds
      next(null);
      return;
    }
    db.findOne({ uid, _id: gid }, (galleryDoc) => {
      console.log(uid, gid, galleryDoc);
      if (!galleryDoc) {
        next('Cannot find gallery, or incorrect permissions');
      } else {
        async.filter(imageIds,
        (id, cb) => cb(null, !(id in imageIds)),
        (_err, newIds) => {
          galleryDoc.images.push(...newIds);
          console.log(galleryDoc);
          db.updateOne({ _id: gid }, { images: galleryDoc.images }, () => {
            if (gid === baseGalleryId) {
              next(null);
            } else {
              module.exports.addImages(baseGalleryId, baseGalleryId, uid, newIds, next);
            }
          });
        });
      }
    });
  },

  updateGid: (galleryname, id, data, cb) => {
    db.updateOne({ name: galleryname, id }, data, (res) => {
      if (res) return cb('updated one gallery');
      return cb('gallery not updated');
    });
  }
};
