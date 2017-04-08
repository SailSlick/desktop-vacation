const fs = require('fs');
const mkdirp = require('mkdirp');
const async = require('async');
const multer = require('multer');
const DBTools = require('../middleware/db');

const db = new DBTools('images');
const fsDb = new DBTools('images-fs');

const IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/bmp',
  'image/gif',
  'image/tiff'
];
const IMAGE_FOLDER = 'private/images';

let indexNumber = 0;

if (!fs.existsSync(IMAGE_FOLDER)) {
  mkdirp.sync(IMAGE_FOLDER);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Multer is lazy...
    const path = `${IMAGE_FOLDER}/${req.session.uid}`;
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
    cb(null, path);
  },
  filename: (req, file, cb) => {
    // name the file after the hash
    if (req.body.hashes[indexNumber]) cb(null, req.body.hashes[indexNumber]);
    else cb(null, Date.now());
  }
});

function fileFilter(req, file, cb) {
  if (!req.body.hashes || !req.body.metadatas) {
    cb(null, false);
  } else {
    // Decode the metadatas and hashes
    const metadatas = JSON.parse(req.body.metadatas);
    const hashes = JSON.parse(req.body.hashes);

    // set the length of the indexNumber so we can index the hashes
    if (indexNumber === 0) {
      indexNumber = hashes.length;
    }
    indexNumber -= 1;
    if (!IMAGE_TYPES.some(type => file.mimetype === type)) cb(null, false);

    // check if the hash is in the db
    fsDb.findOne({ _id: hashes[indexNumber] }, (doc) => {
      if (!doc) {
        // if the doc doesn't exist, create a reference in the images-fs db
        const new_file = {
          _id: hashes[indexNumber],
          location: `${IMAGE_FOLDER}/${req.session.uid}/${hashes[indexNumber]}`,
          refs: 1,
          size: file.size
        };
        fsDb.insertOne(new_file, (docId) => {
          if (docId === hashes[indexNumber]) cb(null, true);
          else {
            console.error('Doc inserted into images-fs doesn\'t have correct _id');
            cb(null, true);
          }
        });
      } else {
        // if the doc exists, increment the ref counter
        doc.refs += 1;
        fsDb.updateOne({ _id: doc._id }, doc, (success) => {
          if (success) {
            const newImage = {
              uid: req.session.uid,
              location: doc.location,
              mimeType: file.mimetype,
              metadata: metadatas[indexNumber],
              hash: hashes[indexNumber],
              shared: false,
              refs: 1
            };

            metadatas.splice(indexNumber, 1);
            hashes.splice(indexNumber, 1);
            if (indexNumber !== 0) indexNumber += 1;
            db.insertOne(newImage, (newId) => {
              if (newId) {
                if (req.body.files) req.body.files.push(newId);
                else req.body.files = [newId];
                cb(null, false);
              } else {
                console.error('New item in images db (not new to fs-images) could not be inserted');
                cb(null, false);
              }
            });
          } else {
            console.error('Updating ref counter failed');
            cb(null, false);
          }
        });
      }
      req.body.metadatas = metadatas;
      req.body.hashes = hashes;
    });
  }
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

  fsGet(hash, next) {
    fsDb.findOne({ _id: hash }, (doc) => {
      if (!doc) {
        next(404, null);
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
          return fsDb.findOne({ _id: file.hash }, (fsDoc) => {
            // User should recieve no errors about filesystem updates
            if (fsDoc) {
              if (fsDoc.refs - 1 === 0) {
                fsDb.removeOne({ _id: file.hash }, (removedFs) => {
                  if (!removedFs) {
                    console.error('Failed to remove from images-fs db', file.hash);
                  } else fs.unlinkSync(file.location);
                });
              } else {
                fsDb.updateRaw(
                  { _id: file.hash },
                  { $inc: { refs: -1 } },
                  (updated) => {
                    if (!updated) {
                      console.error('failed to update images-fs with lower ref', file.hash);
                    }
                  }
                );
              }
            } else console.error('expected a doc to exist in images-fs', file.hash);
            return next();
          });
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
    db.findMany({ uid }, images =>
      async.each(
        images,
        (image, next) => {
          fsDb.findOne({ _id: image.hash }, (fsImage) => {
            if (!fsImage) {
              console.error('Expected an image to exist in fs-images for user purge', image.hash);
            } else if (fsImage.refs - 1 === 0) fs.unlink(fsImage.location, next);
            else {
              fsDb.updateRaw(
                { _id: image.hash },
                { $inc: { refs: -1 } },
                (updated) => {
                  if (!updated) console.error('Lowering a fs-images ref in user purge failed', image.hash);
                }
              );
            }
          });
        },
        (err) => {
          if (err) cb('failed to purge user');
          else db.removeMany({ uid }, () => cb());
        }
      )
    );
  }
};
