const DBTools = require('../middleware/db');

const db = new DBTools('fs.files');

module.exports = {
  add(uid, imageId, next) {
    // The file should already exist thanks to multer
    db.updateOne({ _id: db.getId(imageId) }, { uid }, (success) => {
      if (!success) {
        next('Failure adding user id to image');
      } else {
        next(null);
      }
    });
  },

  get(uid, id, next) {
    db.findOne({ _id: db.getId(id), uid }, (doc) => {
      if (!doc) {
        next('cannot find image, or invalid permissions', null);
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
  }
};
