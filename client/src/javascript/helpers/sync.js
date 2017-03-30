import request from 'request';
import fs from 'fs';
import path from 'path';
import url from 'url';
import mime from 'mime-types';
import DbConn from './db';
import Images from '../models/images';
import Host from '../models/host';
import { danger, success, warning } from './notifier';

function uriToId(uri) {
  // Forgive the following code, it's actually the "correct" way to do it.
  // It may be slower than actually just going left until the first /
  // and using everything to the right. If you think this is how it should
  // be done, comment BAZINGA here in the code review.
  return path.parse(url.parse(uri).pathname).base;
}

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
  uploadImages: (galleryRemoteId, imageId) => {
    Images.get(imageId, (file) => {
      if (file.remoteId) {
        warning('Item is already synced');
        return;
      }
      const formData = {
        gid: galleryRemoteId,
        images: [fs.createReadStream(file.location)]
      };
      const options = {
        formData,
        uri: Host.server_uri.concat('/image/upload'),
        method: 'POST',
        jar: Host.cookie_jar,
        json: true
      };
      request(options, (reqErr, res, body) => {
        errorHandler(reqErr, res, body, (err, result) => {
          if (err) return danger(err);
          return Images.update(imageId, { remoteId: result['image-ids'][0] }, (updateErr) => {
            if (err) danger(updateErr);
            else success('Images uploaded');
          });
        });
      });
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
          `${uriToId(imageUrl)}.${mime.extension(res.headers['content-type'])}`
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

  removeSynced: (uri, cb) => {
    const remoteId = uriToId(uri);
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
    if (!Host.isAuthed()) {
      cb('Not logged in', null);
      return;
    }
    const uri = Host.server_uri.concat(`/image/${remoteId}`);
    const options = {
      uri: uri.concat('/share'),
      jar: Host.cookie_jar,
      method: 'POST',
      json: true
    };
    request(options, (reqErr, response, body) => {
      errorHandler(reqErr, response, body, (err, _) => {
        if (err) return cb(err, null);
        return cb(null, uri);
      });
    });
  }
};
