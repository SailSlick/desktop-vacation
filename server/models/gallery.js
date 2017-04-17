const Joi = require('joi');
const DBTools = require('../middleware/db');

const db = new DBTools('galleries');

const galleryNameValidator = Joi.string()
  .min(3)
  .max(20)
  .required();

const idValidator = Joi.string()
  .hex()
  .length(24);

const metadataValidator = Joi.object().keys({
  rating: Joi.number().required().min(0).max(5),
  tags: Joi.array().items(Joi.string())
}).unknown(false);

const galleryValidator = Joi.object().keys({
  uid: idValidator.required(),
  remoteId: idValidator,
  name: galleryNameValidator,
  users: Joi.array().items(Joi.string()),
  subgalleries: Joi.array().items(idValidator),
  images: Joi.array().items(idValidator),
  metadata: metadataValidator
}).required();

const galleryModel = {
  validateGalleryName: galleryName =>
    Joi.validate(galleryName, galleryNameValidator),

  validateGalleryObject: gallery =>
    Joi.validate(gallery, galleryValidator, { stripUnknown: true }),

  validateGid: gid =>
    Joi.validate(gid, idValidator.required()),

  create: (galleryname, baseGalleryId, uid, cb) => {
    db.findOne({ name: galleryname, uid }, (doc) => {
      if (doc) return cb(400, 'user already has db of that name');
      const galleryData = {
        name: galleryname,
        uid,
        users: [],
        subgalleries: [],
        images: [],
        metadata: {
          rating: 0,
          tags: []
        }
      };
      return galleryModel.insert(galleryData, baseGalleryId, cb);
    });
  },

  insert: (gallery, baseGalleryId, cb) => {
    db.insertOne(gallery, (newId) => {
      if (!newId) return cb(500, 'gallery could bot be inserted');
      if (baseGalleryId === null || baseGalleryId === newId) {
        return cb(null, newId);
      }
      return db.updateRaw(
      { _id: baseGalleryId },
      { $addToSet: { subgalleries: newId.toString() } },
      () => cb(null, newId));
    });
  },

  get: (galleryname, uid, cb) => {
    db.findOne({ name: galleryname, uid }, (doc) => {
      if (doc) return cb(null, doc);
      return cb('gallery not found', null);
    });
  },

  getGid: (gid, cb) => {
    db.findOne({ _id: db.getId(gid) }, (doc) => {
      if (doc) return cb(null, doc);
      return cb('gallery not found', null);
    });
  },

  update: (galleryname, uid, data, cb) => {
    db.updateOne({ name: galleryname, uid }, data, (res) => {
      if (res) return cb('updated one gallery');
      return cb('gallery not updated');
    });
  },

  updateGid: (gid, data, cb) => {
    db.updateOne({ _id: db.getId(gid) }, data, (res) => {
      if (!res) return cb('gallery not updated');
      return cb();
    });
  },

  remove: (gid, cb) => {
    db.removeOne({ _id: db.getId(gid) }, (res) => {
      if (res) return cb();
      return cb('deletion failed');
    });
  },

  addImages: (gid, imageIds, cb) => {
    db.updateRaw(
      { _id: db.getId(gid) },
      // eslint-disable-next-line prefer-template
      { $addToSet: { images: { $each: imageIds.map(x => x + '') } } },
      (success) => {
        if (!success) cb('invalid update');
        else cb();
      }
    );
  },

  removeImageGlobal: (imageId, uid, next) => {
    db.updateMany(
      { uid, images: imageId },
      { $pull: { images: imageId } },
      (success) => {
        if (!success) return next('invalid request, or invalid permissions');
        return next();
      }
    );
  },

};

module.exports = galleryModel;
