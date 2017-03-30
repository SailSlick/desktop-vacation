const async = require('async');
const images = require('../models/image');
const galleries = require('../models/gallery');
const user = require('../models/user');

module.exports = {
  upload: (req, res, next) => {
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
        if (imageIds.length === 0) {
          next({ status: 200, message: 'no images to upload' });
          return;
        }
        user.getBaseGallery(req.session.uid, (baseGalleryId) => {
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
                next({
                  status: 200,
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
      if (err === 401) {
        next({ status: 401, error: 'invalid permissions' });
      } else if (err) {
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
    galleries.removeImageGlobal(req.params.id, req.session.uid, (galleryErr) => {
      if (galleryErr) {
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
  },

  shareImage: (req, res, next) => {
    if (!req.params.id) {
      next({ status: 400, error: 'Invalid image id' });
    }
    images.share(req.session.uid, req.params.id, (err) => {
      if (err) {
        console.error(err);
        next({ status: 400, error: err });
      } else {
        next({ status: 200, message: 'image shared' });
      }
    });
  }
};
