const DBTools = require('../middleware/db');

const db = new DBTools('fs.files');

module.exports = {
  add(uid, imageId, next) {
    // The file should already exist thanks to multer
    db.updateOne({ _id: db.getId(imageId) }, { uid, shared: false }, (success) => {
      if (!success) {
        next('Failure adding user id to image');
      } else {
        next(null);
      }
    });
  },

  get(uid, id, next) {
    db.findOne({ _id: db.getId(id) }, (doc) => {
      if (!doc) {
        next('cannot find image', null);
      } else if (doc.uid !== uid && !doc.shared) {
        next(401, null); // using a number here prevents buggy string comp
      } else {
        next(null, {
          file: db.readFile(id),
          contentType: doc.contentType
        });
      }
    });
  },

  remove(uid, id, next) {
    db.removeOne({ _id: db.getId(id), uid }, (removed) => {
      if (removed) return next();
      return next('cannot find image, or invalid permissions');
    });
  },

  share(uid, imageId, next) {
    db.updateOne(
      { _id: db.getId(imageId), uid },
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
    db.updateOne(
      { _id: db.getId(imageId), uid },
      { shared: false },
      (success, matchedCount) => {
        if (!success && matchedCount < 1) {
          next('failure to unshare image');
        } else {
          next(null);
        }
      }
    );
  },

  purgeUserImages: (uid, cb) => {
    db.removeMany({ uid }, () => cb());
  }
};
