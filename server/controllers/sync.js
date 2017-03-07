const { dirname, join } = require('path');
const async = require('async');
const images = require('../models/image');
const galleries = require('../models/gallery');

const uploadPath = dirname(__dirname);

module.exports = {
  upload: (req, res, next) => {
    console.log(req.files);

    if (!req.files) {
      next({ status: 400, error: 'no files sent' });
      return;
    }
    if (!galleries.verGid(req.body.gid)) {
      next({ status: 400, error: 'invalid gallery id' });
      return;
    }

    async.map(req.files, (f, cb) => {
      console.log('parsing file');
      images.add(join(uploadPath, f.path), cb);
    }, (err, imageIds) => {
      console.log(imageIds);
      if (err) {
        console.error(err);
        next({ status: 400, error: err });
        return;
      }
      galleries.addImages(req.body.gid, imageIds, (error) => {
        console.log(error);
        if (error) {
          next({ error, status: 400 });
        } else {
          res.status(200).json({
            'image-ids': imageIds,
            message: 'images uploaded'
          });
        }
      });
    });
  }
};
