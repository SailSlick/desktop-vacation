const images = require('../models/image');
const galleries = require('../models/gallery');
const user = require('../models/user');

module.exports = {
  uploadMiddleware: images.uploadMiddleware,

  checkId: (req, res, next) => {
    if (!req.params.id) {
      return res.status(400).json({ status: 400, error: 'Invalid image id' });
    }
    return next();
  },

  upload: (req, res, next) => {
    if (!galleries.verifyGid(req.body.gid)) {
      return next({ status: 400, error: 'invalid gallery id' });
    }

    if (!req.files) {
      return next({ status: 400, error: 'no files sent' });
    }

    // Combine the form data, file path and uid to form
    // actual database documents
    const newImages = req.files.map((file, id) => ({
      uid: req.session.uid,
      location: file.path,
      metadata: req.body.metadatas[id],
      shared: false,
      // TODO work out when this needs to be incremented
      refs: 1
    }));

    // Add images to images collection
    return images.addMany(newImages, (newIds) => {
      if (newIds === false) return next({ status: 500, error: 'upload failed' });

      // Get user's base gallery id
      return user.getBaseGallery(req.session.uid, baseGalleryId =>

        // Add images to base gallery
        galleries.addImages(baseGalleryId, newIds, (error) => {
          if (error) return next({ status: 500, error: 'upload failed' });
          return res.status(200).json({
            message: 'images uploaded',
            'image-ids': newIds
          });
        })
      );
    });
  },

  download: (req, res, next) => {
    images.get(req.session.uid, req.params.id, (err, image) => {
      if (err === 401) {
        next({ status: 401, error: 'invalid permissions' });
      } else if (err === 404) {
        next({ status: 404, error: 'image not found' });
      } else {
        res.sendFile(image.location);
      }
    });
  },

  remove: (req, res, next) => {
    images.remove(req.session.uid, req.params.id, (error) => {
      if (error) {
        next({ status: 400, error });
      } else {
        next({ status: 200, message: 'image deleted' });
      }
    });
  },

  shareImage: (req, res, next) => {
    images.share(req.session.uid, req.params.id, (err) => {
      if (err) {
        console.error(err);
        next({ status: 400, error: err });
      } else {
        next({ status: 200, message: 'image shared' });
      }
    });
  },

  unshareImage: (req, res, next) => {
    images.unshare(req.session.uid, req.params.id, (err) => {
      if (err) {
        console.error(err);
        next({ status: 400, error: err });
      } else {
        next({ status: 200, message: 'image unshared' });
      }
    });
  }
};
