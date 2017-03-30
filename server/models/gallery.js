const DBTools = require('../middleware/db');

const db = new DBTools('galleries');

module.exports = {
  verifyGalleryName: groupname =>
    typeof groupname === 'string' && groupname.length <= 20 && groupname.length >= 3,

  verifyGid: gid => typeof gid === 'string' && gid.length === 24,

  create: (galleryname, baseGalleryId, uid, cb) => {
    db.findOne({ name: galleryname, uid }, (doc) => {
      if (doc) return cb(400, 'user already has db of that name');
      const galleryData = {
        name: galleryname,
        uid,
        users: [],
        subgalleries: [],
        images: [],
        metadata: {
          rating: 0,
          tags: []
        }
      };
      return db.insertOne(galleryData, (res) => {
        if (!res) {
          return cb(500, 'gallery could not be inserted');
        } else if (baseGalleryId === null || baseGalleryId === res) {
          return cb(null, res);
        }
        return db.updateRaw(
        { _id: baseGalleryId, uid },
        { $addToSet: { subgallaries: res.toString() } },
        _ => cb(null, res));
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
    gid = db.getId(gid);
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
    db.updateRaw(
      { uid, _id: db.getId(gid) },
      { $addToSet: { images: { $each: imageIds } } },
      (success) => {
        if (gid === baseGalleryId) {
          next();
        } else if (!success) {
          next('invalid update');
        } else {
          module.exports.addImages(baseGalleryId, baseGalleryId, uid, imageIds, next);
        }
      }
    );
  },

  removeImageGlobal: (imageId, uid, next) => {
    db.updateMany(
      { uid, images: imageId },
      { $pull: { images: imageId } },
      (success) => {
        if (!success) return next('invalid gallery, or invalid permissions');
        return next();
      }
    );
  },

  updateGid: (galleryname, id, data, cb) => {
    db.updateOne({ name: galleryname, id }, data, (res) => {
      if (res) return cb('updated one gallery');
      return cb('gallery not updated');
    });
  }
};
