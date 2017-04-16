import request from 'request';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { each, eachOf } from 'async';
import DbConn from './db';
import Images from '../models/images';
import Galleries from '../models/galleries';
import Host from '../models/host';
import { danger, warning, success } from './notifier';

function errorHandler(cb) {
  return (reqErr, response, body) => {
    if (reqErr) {
      danger(reqErr);
      cb(reqErr);
    } else if (response.statusCode !== 200) {
      danger(body.error);
      cb(body.error);
    } else {
      cb(null, body);
    }
  };
}

const Sync = {
  uploadImages: (imageIds, cb, controlSaving) => {
    if (!Host.isAuthed()) {
      danger('Can\'t sync, try signing in!');
      return cb();
    }
    const formData = {
      hashes: [],
      metadatas: [],
      images: []
    };
    const submittedIds = [];
    const existingIds = [];
    return Images.getMany(imageIds, (images) => {
      if (!images) {
        danger('Error retrieving image(s)');
        return cb();
      }

      // Put all images into formData
      images.forEach((image) => {
        // Only those that need syncing
        if (!image.remoteId) {
          formData.hashes.push(image.hash);
          formData.metadatas.push(image.metadata);
          formData.images.push(fs.createReadStream(image.location));
          submittedIds.push(image.$loki);
        } else {
          existingIds.push(image.remoteId);
        }
      });

      // Check if there is anything to sync
      if (formData.hashes.length === 0) {
        warning('Image(s) already synced');
        return cb(existingIds);
      }

      const options = {
        formData,
        uri: Host.server_uri.concat('/image/upload'),
        method: 'POST',
        jar: Host.cookie_jar,
        json: true
      };

      // JSON encode the data arrays
      formData.hashes = JSON.stringify(formData.hashes);
      formData.metadatas = JSON.stringify(formData.metadatas);

      // Upload the images
      return request(options, errorHandler((err, body) => {
        if (err) return cb();
        if (!controlSaving) Galleries.should_save = false;

        // Map each remoteId to the respective image
        return eachOf(body['image-ids'], (remoteId, index, next) => {
          if (!controlSaving) Galleries.should_save = (index === body['image-ids'].length - 1);
          Images.update(submittedIds[index], { remoteId }, () => next());
        }, () => {
          success(`${formData.images.length} image(s) uploaded`);
          cb(existingIds.concat(body['image-ids']));
        });
      }));
    });
  },

  syncGalleryImages(gallery, remoteGallery, cb) {
    // Get all the images
    // eslint-disable-next-line padded-blocks
    Images.getMany(gallery.images, (imagesFull) => {

      // Split them into removed and unsynced
      const removedImages = imagesFull.filter(img =>
        img.remoteId && !remoteGallery.images.some(imgId => imgId === img.remoteId)
      );
      const unsyncedImages = imagesFull.filter(img => !img.remoteId);

      // Remove the removed ones
      each(removedImages, (img, next) =>
        Images.remove(img.$loki, () => next()),

      // Upload the new ones
      () => Sync.uploadImages(unsyncedImages.map(img => img.$loki), (remoteIds) => {
        if (!remoteIds) cb('Remote ids not sent by server');
        else cb();
      }));
    });
  },

  syncGallery: (gallery, cb) => {
    // Download the remoteGallery
    const options = {
      uri: Host.server_uri.concat(`/gallery/${gallery.remoteId}`),
      jar: Host.cookie_jar,
      json: true
    };
    request(options, errorHandler((errGet, body) => {
      if (errGet) return cb(errGet);

      const remoteGallery = body.data;

      // Sync the images
      // eslint-disable-next-line padded-blocks
      return Sync.syncGalleryImages(gallery, remoteGallery, (err) => {
        if (err) return cb(err);

        // Get all the subgalleries
        // eslint-disable-next-line padded-blocks
        return Galleries.getMany(gallery.subgalleries, (subgalleriesFull) => {

          // Split them into removed and unsynced
          const removedGalleries = subgalleriesFull.filter(gal =>
            gal.remoteId && !remoteGallery.subgalleries.some(galId => galId === gal.remoteId)
          );
          const unsyncedGalleries = subgalleriesFull.filter(gal => !gal.remoteId);

          // Remove the removed ones
          each(removedGalleries, (gal, next) =>
            Galleries.remove(gal.$loki, () => next()),

          // Upload the new ones
          () => each(unsyncedGalleries.map(gal => gal.$loki), (gid, next) =>
            Sync.uploadGallery(gid, (remoteId) => {
              if (!remoteId) return next('Remote id not sent by server');

              // Set the remoteId of all these subgalleries
              return Galleries.update(gid, { remoteId }, doc =>
                next((!doc && `Failed to update remoteId of gallery ${gid}`) || null)
              );
            }),
          cb
          ));
        });
      });
    }));
  },

  upsertRemoteGallery: (gallery, cb) => {
    // Get remoteIds for images and galleries
    Galleries.getMany(gallery.subgalleries, subgalleriesFull =>
      Images.getMany(gallery.images, (imagesFull) => {
        const subgalleries = subgalleriesFull.map(x => x.remoteId);
        const images = imagesFull.map(x => x.remoteId);
        const options = {
          form: {
            gallery: {
              uid: Host.uid,
              remoteId: gallery.remoteId,
              name: gallery.name,
              images,
              subgalleries,
              metadata: gallery.metadata,
              users: []
            }
          },
          uri: Host.server_uri.concat('/gallery/upload'),
          jar: Host.cookie_jar,
          method: 'POST',
          json: true
        };
        request(options, errorHandler((errUp, body) => {
          if (errUp) return cb(errUp);

          // Set the remoteId of this gallery
          return Galleries.update(gallery.$loki, { remoteId: body.gid }, (doc) => {
            if (!doc) cb(`Failed to update remoteId of gallery ${gallery.$loki}`);
            else cb();
          });
        }));
      })
    );
  },

  uploadGallery: (gid, cb) => {
    const isSaveController = Galleries.should_save;
    if (isSaveController) Galleries.should_save = false;

    Galleries.get(gid, (gallery) => {
      // Has this gallery been synced already?
      if (gallery.remoteId) {
        return Sync.syncGallery(gallery, (err) => {
          if (err) {
            danger(err);
            return cb(err);
          }
          return Sync.upsertRemoteGallery(gallery, (errUp) => {
            if (isSaveController) Galleries.should_save = true;
            document.dispatchEvent(Galleries.gallery_update_event);
            if (errUp) {
              danger(errUp);
              return cb(errUp);
            }
            return cb();
          });
        });
      }

      // Is this a new gallery?
      // Upload the images
      return Sync.uploadImages(gallery.images, (remoteIds) => {
        if (!remoteIds) return cb('Remote ids not sent by server');

        // Upload the subgalleries
        return each(gallery.subgalleries, (galId, next) =>
          Sync.uploadGallery(galId, next),
        (errGal) => {
          if (errGal) {
            danger(errGal);
            return cb(errGal);
          }

          // UPLOAD THIS GALLERY \o/
          return Sync.upsertRemoteGallery(gallery, (errUp) => {
            if (isSaveController) Galleries.should_save = true;
            document.dispatchEvent(Galleries.gallery_update_event);
            if (errUp) {
              danger(errUp);
              return cb(errUp);
            }
            return cb();
          });
        });
      });
    });
  },

  unsyncGallery: (gid, cb) => {
    Galleries.get(gid, (gallery) => {
      const options = {
        uri: Host.server_uri.concat(`/gallery/${gallery.remoteId}/remove`),
        jar: Host.cookie_jar,
        method: 'POST',
        json: true
      };
      request(options, errorHandler(cb));
    });
  },

  downloadImage: (id, gid, cb) => {
    if (gid === null) gid = '';
    const imageUrl = Host.server_uri.concat(`/image/${id}/${gid || ''}`);
    console.log('Downloading image to disk');
    const options = {
      uri: imageUrl,
      jar: Host.cookie_jar
    };
    // Because the path of the file depends on the type of response, I had to
    // do some janky things here and use this promise syntax
    let newFilePath = null;
    const req = request
    .get(options)
    .on('response', (res) => {
      if (res.statusCode === 200) {
        newFilePath = path.join(
          DbConn.getUserDataFolder(),
          `${id}.${mime.extension(res.headers['content-type'])}`
        );
        req.pipe(fs.createWriteStream(newFilePath));
      } else {
        console.error('Image couldn\'t be downloaded', res.statusCode, res.message);
        danger('Couldn\'t download image');
        cb('Status code was not 200', null);
      }
    })
    .on('error', (err) => {
      if (err) {
        danger('Invalid image');
        cb(err, null);
      }
    })
    .on('end', () => cb(null, newFilePath));
  },

  downloadImageData: (remoteId, cb) => {
    const options = {
      uri: Host.server_uri.concat(`/gallery/${remoteId}/data`),
      jar: Host.cookie_jar,
      method: 'GET',
      json: true
    };
    request(options, errorHandler((errDl, body) => {
      if (errDl) return cb(errDl);

      // Add to database
      const image = body.image;
      return Images.insert(image, newImg => cb(null, newImg.$loki));
    }));
  },

  downloadGalleryImages: (gallery, cb) => {
    // Determine what images need downloading
    Images.getManyRemote(gallery.images, (imagesFull) => {
      // Filter for the missing ones
      const missingImages = gallery.images.filter(remoteId =>
        !imagesFull.some(image => image.remoteId === remoteId)
      );

      // Get ids of ones we have
      const imageIds = imagesFull.map(image => image.$loki);

      // Download the missing ones
      each(missingImages, (remoteId, next) => {
        Sync.downloadImageData(remoteId, (errDl, id) => {
          if (errDl) return next(errDl);

          // Append new ID to imageIds
          imageIds.push(id);
          return next();
        });
      }, (errDl) => {
        if (errDl) cb(errDl);

        // Return complete list of local ids
        return cb(null, imageIds);
      });
    });
  },

  downloadGallery: (remoteId, cb, doNotInsert) => {
    // Get the remote gallery data
    const options = {
      uri: Host.server_uri.concat(`/gallery/${remoteId}`),
      jar: Host.cookie_jar,
      method: 'GET',
      json: true
    };
    request(options, errorHandler((errGet, body) => {
      if (errGet) return cb(errGet);
      const gallery = body.data;
      gallery.images = gallery.images || [];
      gallery.subgalleries = gallery.subgalleries || [];

      // Download the images
      return Sync.downloadGalleryImages(gallery, (errImgs, imageIds) => {
        if (errImgs) return cb(errImgs);

        // Determine what subgalleries need downloading
        return Galleries.getManyRemote(gallery.subgalleries, (subgalleriesFull) => {
          // Filter for the missing ones
          const missingGalleries = gallery.subgalleries.filter(remoteSubId =>
            !subgalleriesFull.some(subgal => subgal.remoteId === remoteSubId)
          );

          // Get ids of ones we have
          const subgalleryIds = subgalleriesFull.map(subgal => subgal.$loki);

          // Download the missing ones
          each(missingGalleries, (remoteSubId, next) => {
            Sync.downloadGallery(remoteSubId, (errDl, id) => {
              if (errDl) return next(errDl);

              // Append new ID to subgalleryIds
              subgalleryIds.push(id);
              return next();
            });
          }, (errDl) => {
            if (errDl) return cb(errDl);

            // Save the gallery
            gallery.uid = Host.uid;
            gallery.images = imageIds;
            gallery.subgalleries = subgalleryIds;
            if (doNotInsert) return cb(null, gallery);
            return Galleries.insert(gallery, newGal => cb(null, newGal.$loki));
          });
        });
      });
    }));
  },

  removeSynced: (remoteId, cb) => {
    const options = {
      uri: Host.server_uri.concat(`/image/${remoteId}/remove`),
      jar: Host.cookie_jar,
      method: 'POST',
      json: true
    };
    request(options, errorHandler(cb));
  },

  shareImage: (remoteId, cb) => {
    if (!Host.isAuthed()) return cb('Not logged in', null);
    const uri = Host.server_uri.concat(`/image/${remoteId}`);
    const options = {
      uri: uri.concat('/share'),
      jar: Host.cookie_jar,
      method: 'POST',
      json: true
    };
    return request(options, errorHandler(err => cb(err, uri)));
  },

  unshareImage: (remoteId, cb) => {
    if (!Host.isAuthed()) return cb('Not logged in', null);
    const options = {
      uri: Host.server_uri.concat(`/image/${remoteId}/unshare`),
      jar: Host.cookie_jar,
      method: 'POST',
      json: true
    };
    return request(options, errorHandler(cb));
  }
};

export default Sync;
