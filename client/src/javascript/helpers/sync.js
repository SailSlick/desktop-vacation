import request from 'request';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import DbConn from './db';
import Images from '../models/images';
import Host from '../models/host';
import { danger } from './notifier';

function errorHandler(reqErr, response, body, cb) {
  if (reqErr) {
    cb(reqErr, null);
  } else if (response.statusCode !== 200) {
    cb(body.error, null);
  } else {
    cb(null, body);
  }
}

export default {
  uploadImages: (galleryRemoteId, imageId, cb) => {
    Images.get(imageId, (file) => {
      if (!file) {
        return cb('Invalid image ID');
      }
      if (file.remoteId) {
        return cb('Item is already synced');
      }
      const formData = {
        hashes: JSON.stringify([file.hash]),
        metadatas: JSON.stringify([file.metadata]),
        images: [fs.createReadStream(file.location)]
      };
      const options = {
        formData,
        uri: Host.server_uri.concat('/image/upload'),
        method: 'POST',
        jar: Host.cookie_jar,
        json: true
      };
      return request(options, (reqErr, res, body) => {
        errorHandler(reqErr, res, body, (err, result) => {
          if (err) {
            return cb(err);
          }
          return Images.update(imageId, { remoteId: result['image-ids'][0] }, (updateErr) => {
            if (err) {
              cb(updateErr);
            } else {
              cb(null, 'Images uploaded', result['image-ids'][0]);
            }
          });
        });
      });
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

  removeSynced: (remoteId, cb) => {
    const options = {
      uri: Host.server_uri.concat(`/image/${remoteId}/remove`),
      jar: Host.cookie_jar,
      method: 'POST',
      json: true
    };
    request(options, (reqErr, response, body) => {
      errorHandler(reqErr, response, body, (err, _) => {
        if (err) return cb(err);
        return cb(null);
      });
    });
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
    return request(options, (reqErr, response, body) => {
      errorHandler(reqErr, response, body, (err, _) => {
        if (err) return cb(err, null);
        return cb(null, uri);
      });
    });
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
      errorHandler(reqErr, response, body, (err, _) => {
        if (err) return cb(err);
        return cb(null);
      });
    });
  }
};
