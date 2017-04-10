import request from 'request';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { eachOf } from 'async';
import DbConn from './db';
import Images from '../models/images';
import Galleries from '../models/galleries';
import Host from '../models/host';
import { danger, success, warning } from './notifier';

function errorHandler(reqErr, response, body, cb, next) {
  if (reqErr) {
    danger(reqErr);
    next(reqErr);
  } else if (response.statusCode !== 200) {
    danger(body.error);
    next(body.error);
  } else {
    cb();
  }
}

export default {
  uploadImages: (imageIds, cb) => {
    const formData = {
      hashes: [],
      metadatas: [],
      images: []
    };
    const submittedIds = [];
    Images.getMany(imageIds, (images) => {
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
        }
      });

      // Check if there is anything to sync
      if (formData.hashes.length === 0) {
        warning('Image(s) already synced');
        return cb();
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
      return request(options, (reqErr, res, body) =>
        errorHandler(reqErr, res, body, () => {
          Galleries.should_save = false;

          // Map each remoteId to the respective image
          eachOf(body['image-ids'], (remoteId, index, next) => {
            Galleries.should_save = (index === body['image-ids'].length - 1);
            Images.update(submittedIds[index], { remoteId }, () => next());
          }, () => {
            success(`${formData.images.length} image(s) uploaded`);
            cb(body);
          });
        }, () => cb())
      );
    });
  },

  downloadImage: (id, cb) => {
    const imageUrl = Host.server_uri.concat(`/image/${id}`);
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

  removeSynced: (remoteId, cb) => {
    const options = {
      uri: Host.server_uri.concat(`/image/${remoteId}/remove`),
      jar: Host.cookie_jar,
      method: 'POST',
      json: true
    };
    request(options, (reqErr, response, body) =>
      errorHandler(reqErr, response, body, cb, cb)
    );
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
    return request(options, (reqErr, response, body) =>
      errorHandler(reqErr, response, body, () => cb(null, uri), cb)
    );
  },

  unshareImage: (remoteId, cb) => {
    if (!Host.isAuthed()) return cb('Not logged in', null);
    const options = {
      uri: Host.server_uri.concat(`/image/${remoteId}/unshare`),
      jar: Host.cookie_jar,
      method: 'POST',
      json: true
    };
    return request(options, (reqErr, response, body) => {
      errorHandler(reqErr, response, body, cb, cb);
    });
  }
};
