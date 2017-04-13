const images = require('../models/image');
const galleries = require('../models/gallery');
const user = require('../models/user');

function basicErrorHandler(error, next, message) {
  if (error) {
    console.error(error);
    next({ status: 400, error });
  } else {
    next({ status: 200, message });
  }
}

module.exports = {
  uploadMiddleware: images.uploadMiddleware,

  checkId: (req, res, next) => {
    if (!req.params.id) {
      return res.status(400).json({ status: 400, error: 'Invalid image id' });
    }
    return next();
  },

  upload: (req, res, next) => {
    if ((!req.files && !req.body.files) || (!req.body.hashes || !req.body.metadatas)) {
      return next({ status: 400, error: 'invalid request' });
    }

    // Decode the metadatas and hashes
    let metadatas = req.body.metadatas;
    let hashes = req.body.hashes;
    const totalFiles = (req.files || []).length + (req.body.files || []).length;

    if (totalFiles === 0 || req.body.metadatas.length !== totalFiles
      || totalFiles !== req.body.hashes.length) {
      return next({ status: 400, error: 'invalid request' });
    }

    if (req.body.files && req.files.length === 0) {
      // Get user's base gallery id
      return user.getBaseGallery(req.session.uid, baseGalleryId =>
        // Add images to base gallery
        galleries.addImages(baseGalleryId, req.body.files, (error) => {
          if (error) return next({ status: 500, error: 'upload failed' });
          return res.status(200).json({
            message: 'images uploaded',
            'image-ids': req.body.files
          });
        })
      );
    }

    metadatas = metadatas.filter(x => x !== null);
    hashes = hashes.filter(x => x !== null);

    if (typeof metadatas === 'string') metadatas = JSON.parse(metadatas);
    if (typeof hashes === 'string') hashes = JSON.parse(hashes);


    // Combine the form data, file path and uid to form
    // actual database documents
    const newImages = req.files.map((file, id) => ({
      uid: req.session.uid,
      location: file.path,
      mimeType: file.mimetype,
      metadata: metadatas[id],
      hash: hashes[id],
      shared: false,
      refs: 1
    }));
    // Add images to images collection
    return images.addMany(newImages, (newIds) => {
      if (newIds === false) return next({ status: 500, error: 'upload failed' });
      if (req.body.files) newIds = newIds.concat(req.body.files);

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
    images.get(req.params.id, (err, image) => {
      if (err) {
        next({ status: 404, error: 'image not found' });
      } else if (image.uid !== req.session.uid && !image.shared) {
        next({ status: 401, error: 'invalid permissions' });
      } else {
        res.sendFile(`${process.cwd()}/${image.location}`, {
          headers: { 'Content-Type': image.mimeType },
          dotfiles: 'deny'
        });
      }
    });
  },

  groupImageDownload: (req, res, next) => {
    const uid = req.session.uid;
    const username = req.session.username;

    images.get(req.params.id, (err, image) => {
      if (err) {
        next({ status: 404, error: 'image not found' });
      } else {
        galleries.getGid(req.params.gid, (gErr, doc) => {
          if (gErr) {
            return next({ status: 404, error: 'group doesn\'t exist' });
          }
          if (doc.uid !== uid && doc.users.indexOf(username) === -1) {
            return next({ status: 400, error: 'user isn\'t member of group' });
          }
          return res.sendFile(`${process.cwd()}/${image.location}`, {
            headers: { 'Content-Type': image.mimeType },
            dotfiles: 'deny'
          });
        });
      }
    });
  },

  remove: (req, res, next) => {
    galleries.removeImageGlobal(
      req.params.id,
      req.session.uid,
      (err) => {
        if (err) return next({ status: 400, error: err });
        return images.remove(
          req.session.uid,
          req.params.id,
          error => basicErrorHandler(error, next, 'image deleted')
        );
      }
    );
  },

  shareImage: (req, res, next) => {
    images.share(
      req.session.uid,
      req.params.id,
      error => basicErrorHandler(error, next, 'image shared')
    );
  },

  unshareImage: (req, res, next) => {
    images.unshare(
      req.session.uid,
      req.params.id,
      error => basicErrorHandler(error, next, 'image unshared')
    );
  }
};
