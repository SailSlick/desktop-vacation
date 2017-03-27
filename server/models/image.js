const DBTools = require('../middleware/db');

const db = new DBTools('fs.files');

module.exports = {
  add(uid, imageId, next) {
    db.updateOne({ _id: imageId }, { uid }, (success) => {
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
        next('cannot find image, or invalid permissions', null);
      } else {
        next(null, {
          file: db.readFile(id),
          contentType: doc.contentType
        });
      }
    });
  },

  // look into weather this is truely removing the GridFS file chunks
  remove(uid, id, next) {
    db.removeOne({ _id: db.getId(id), uid }, (removed) => {
      if (removed) {
        next();
      } else {
        next('cannot find image, or invalid permissions');
      }
    });
  }
};
