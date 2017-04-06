const DBTools = require('../middleware/db');

const fileDb = new DBTools('fs.files');
const chunkDb = new DBTools('fs.chunks');

module.exports = {
  add(uid, imageId, hash, next) {
    // The file should already exist thanks to multer
    fileDb.updateOne({ _id: fileDb.getId(imageId) }, { uid, hash, shared: false }, (success) => {
      if (!success) {
        next('Failure adding user id to image');
      } else {
        next(null);
      }
    });
  },

  get(uid, id, next) {
    fileDb.findOne({ _id: fileDb.getId(id) }, (doc) => {
      if (!doc) {
        next('cannot find image', null);
      } else if (doc.uid !== uid && !doc.shared) {
        next(401, null); // using a number here prevents buggy string comp
      } else {
        next(null, {
          file: fileDb.readFile(id),
          contentType: doc.contentType,
          hash: doc.hash
        });
      }
    });
  },

  remove(uid, id, next) {
    fileDb.removeOne({ _id: fileDb.getId(id), uid }, (removed) => {
      if (removed) return next();
      return next('cannot find image, or invalid permissions');
    });
  },

  removeChunks(id, next) {
    chunkDb.removeMany({ files_id: chunkDb.getId(id) }, (removed) => {
      if (removed) return next();
      return next('cannot find image, or invalid permissions');
    });
  },

  share(uid, imageId, next) {
    fileDb.updateOne(
      { _id: fileDb.getId(imageId), uid },
      { shared: true },
      (success, matchedCount) => {
        if (!success && matchedCount < 1) {
          next('failure to share image');
        } else {
          next(null);
        }
      });
  },

  unshare(uid, imageId, next) {
    fileDb.updateOne({ _id: fileDb.getId(imageId), uid }, { shared: false }, (success) => {
      if (!success) {
        next('failure to unshare image');
      } else {
        next(null);
      }
    });
  },

  purgeUserImages: (uid, cb) => {
    fileDb.removeMany({ uid }, () => cb());
  }
};
