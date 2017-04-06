const fs = require('fs');
const async = require('async');
const multer = require('multer');
const DBTools = require('../middleware/db');

const db = new DBTools('images');

const IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/bmp',
  'image/gif',
  'image/tiff'
];

const IMAGE_FOLDER = 'private/images';

if (!fs.existsSync(IMAGE_FOLDER)) {
  fs.mkdirSync(IMAGE_FOLDER);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Multer is lazy...
    const path = `${IMAGE_FOLDER}/${req.session.uid}`;
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
    cb(null, req.session.uid);
  }
});

function fileFilter(req, file, cb) {
  return cb(null, IMAGE_TYPES.some(type => file.mimetype === type));
}

module.exports = {
  uploadMiddleware: multer({ storage, fileFilter }).array('images'),

  addMany(images, cb) {
    db.insertMany(images, cb);
  },

  get(uid, id, next) {
    db.findOne({ _id: db.getId(id) }, (doc) => {
      if (!doc) {
        next(404, null);
      } else if (doc.uid !== uid && !doc.shared) {
        next(401, null);
      } else {
        next(null, doc);
      }
    });
  },

  remove(uid, id, next) {
    module.exports.get(uid, id, (err, file) => {
      if (err) {
        return next('cannot find image, or invalid permissions');
      }
      if (file.refs - 1 === 0) {
        return db.removeOne({ _id: db.getId(id), uid }, (removed) => {
          if (!removed) {
            return next('failed to remove image');
          }
          fs.unlinkSync(file.path);
          return next();
        });
      }
      return db.updateRaw(
        { _id: db.getId(id), uid },
        { $inc: { refs: -1 } },
        (updated) => {
          if (!updated) {
            return next('failed to remove image');
          }
          return next();
        }
      );
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
    db.updateOne({ _id: db.getId(imageId), uid }, { shared: false }, (success) => {
      if (!success) {
        next('failure to unshare image');
      } else {
        next(null);
      }
    });
  },

  purgeUserImages: (uid, cb) => {
    db.findMany({ uid }, images =>
      async.each(
        images,
        (image, next) =>
          fs.unlink(image.path, next),
        (err) => {
          if (err) cb('failed to purge user');
          else db.removeMany({ uid }, () => cb());
        }
      )
    );
  }
};
