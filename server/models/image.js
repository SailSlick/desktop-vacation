const DBTools = require('../middleware/db');

const db = new DBTools('fs.files');

module.exports = {
  add(uid, imageId, next) {
    db.updateOne({ _id: imageId }, { uid }, (success) => {
      if (!success) {
        next('Failure setting user to image');
      } else {
        next(null);
      }
    });
  },

  get(uid, id, next) {
    db.findOne({ _id: id }, (doc) => {
      if (!doc) {
        next('cannot find image', null);
      } else if (uid !== doc.uid) {
        console.log(uid);
        console.log(doc.uid);
        next('invalid permissions', null);
      } else {
        console.log(doc);
        next(null, {
          file: db.readFile(id),
          contentType: doc.contentType
        });
      }
    });
  }
};
