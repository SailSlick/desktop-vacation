const async = require('async');
const images = require('../models/image');
const galleries = require('../models/gallery');

module.exports = {
  upload: (req, res, next) => {
    if (!req.files) {
      next({ status: 400, error: 'no files sent' });
      return;
    }
    if (!galleries.verGid(req.body.gid)) {
      next({ status: 400, error: 'invalid gallery id' });
      return;
    }

    async.map(req.files, (f, cb) => {
      cb(null, f.id);
    }, (err, imageIds) => {
      if (err) {
        console.error(err);
        next({ status: 400, error: err });
        return;
      }
      galleries.addImages(req.body.gid, imageIds, (error) => {
        if (error) {
          console.error(error);
          next({ error, status: 400 });
        } else {
          res.status(200).json({
            'image-ids': imageIds,
            message: 'images uploaded'
          });
        }
      });
    });
  },

  download: (req, res, next) => {
    if (!req.params.id) {
      next({ status: 400, error: 'Invalid image id' });
    }
    images.get(req.params.id, (err, image) => {
      if (err) {
        console.error(err);
        next({ status: 400, error: err });
      } else {
        res.send(image);
      }
    });
  }
};
