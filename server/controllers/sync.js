const async = require('async');
const util = require('util');
const images = require('../models/image');
const galleries = require('../models/gallery');
const user = require('../models/user');

module.exports = {
  upload: (req, res, next) => {
    console.log(util.inspect(req.body, false, null));
    console.log(req.headers['content-type']);
    if (!req.files) {
      next({ status: 400, error: 'no files sent' });
      return;
    }
    if (!galleries.verifyGid(req.body.gid)) {
      next({ status: 400, error: 'invalid gallery id' });
      return;
    }
    async.map(req.files,
      (f, cb) => {
        images.add(req.session.uid, f.id, (err) => {
          if (err) cb(err, null);
          else cb(null, f.id.toString());
        });
      },
      (err, imageIds) => {
        if (err) {
          console.error(err);
          next({ status: 400, error: err });
          return;
        }
        user.getBaseGallery(req.session.uid, (baseGalleryErr, baseGalleryId) => {
          if (baseGalleryErr) {
            next({ error: baseGalleryErr, status: 500 });
            return;
          }
          galleries.addImages(
            req.body.gid,
            baseGalleryId.toString(),
            req.session.uid,
            imageIds,
            (add_error) => {
              if (add_error) {
                console.error(add_error);
                next({ error: add_error, status: 400 });
              } else {
                res.status(200).json({
                  'image-ids': imageIds,
                  message: 'images uploaded'
                });
              }
            });
        });
      }
    );
  },

  download: (req, res, next) => {
    if (!req.params.id) {
      next({ status: 400, error: 'Invalid image id' });
    }
    images.get(req.session.uid, req.params.id, (err, image) => {
      if (err) {
        console.error(err);
        next({ status: 400, error: err });
      } else {
        res.set('Content-Type', image.contentType);

        image.file.on('error', () => {
          next({ status: 500, error: 'failed to retreive file' });
        });
        image.file.pipe(res);
      }
    });
  },

  remove: (req, res, next) => {
    if (!req.params.id) {
      next({ status: 400, error: 'Invalid image id' });
    }
    galleries.remoteImageGlobal(req.params.id, req.session.uid, (galleryErr) => {
      if (galleryErr) {
        console.error('!!! Error that should never happen');
        console.error(galleryErr);
        next({ status: 500, error: galleryErr });
      }
      images.remove(req.session.uid, req.params.id, (imageErr) => {
        if (imageErr) {
          next({ status: 400, error: imageErr });
        } else {
          next({ status: 200, message: 'image deleted' });
        }
      });
    });
  }
};
