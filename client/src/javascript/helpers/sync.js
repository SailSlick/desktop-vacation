import request from 'request';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { extension } from 'mime-types';
import Images from '../models/images';
import Host from '../models/host';
import { danger, success } from './notifier';

export default {
  uploadImages: (galleryRemoteId, imageId) => {
    Images.get(imageId, (file) => {
      const formData = {
        gid: galleryRemoteId
      };
      formData['images[0]'] = fs.createReadStream(file.location);
      const options = {
        formData,
        uri: Host.server_uri.concat('/gallery/upload'),
        method: 'POST',
        jar: Host.cookie_jar,
      };
      request(options, (err, res, body) => {
        if (err) {
          danger('Could not sync image');
        } else if (res.statusCode !== 200) {
          danger(`Invalid request: ${body.error}`);
        } else {
          success(body.message);
        }
      });
    });
  },

  urlToFile: (imageUrl, cb) => {
    let newFilePath = null;
    const req = request
    .get(imageUrl)
    .on('response', (res) => {
      if (res.statusCode === 200) {
        newFilePath = path.join(
          __dirname, 'userData',
          `${path.parse(url.parse(imageUrl).pathname).base}.${extension(res.headers['content-type'])}`
        );
        req.pipe(fs.createWriteStream(newFilePath));
      } else {
        danger('Couldn\'t download image');
        cb('Status code was not 200', null);
      }
    })
    .on('error', (err) => {
      if (err) {
        danger('Request is stupid! Sorry!', null);
        cb(err, null);
      }
    })
    .on('end', () => {
      cb(null, newFilePath);
    });
  }
};
