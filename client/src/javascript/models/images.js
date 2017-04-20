import fs from 'fs';
import jetpack from 'fs-jetpack';
import Host from './host';
import DbConn from '../helpers/db';
import Sync from '../helpers/sync';
import Galleries from './galleries';

const gallery_update_event = new Event('gallery_updated');
let image_db;

// Exported methods
const Images = {
  get: (id, cb) => image_db.findOne({ $loki: id }, cb),

  getByUri: (uri, cb) => image_db.findOne({ uri }, cb),

  getRemoteId: (remoteId, cb) => image_db.findOne({ remoteId }, cb),

  getMany: (ids, cb) => image_db.findMany({ $loki: { $in: ids } }, cb),

  getManyRemote: (remoteIds, cb) => image_db.findMany({ remoteId: { $in: remoteIds } }, cb),

  add: (path, cb) => {
    // make the hash
    jetpack.inspectAsync(path, { checksum: 'sha1', times: true }).then((fileDetails) => {
      const doc = {
        hash: fileDetails.sha1,
        size: fileDetails.size,
        modified: fileDetails.modifyTime,
        metadata: { rating: 0, tags: [] },
        location: path
      };

      Images.insert(doc, cb);
    });
  },

  insert: (image, cb) => {
    // Check if it already exists
    image_db.findOne({ hash: image.hash }, (ex_image) => {
      // If it already existed, return the existing image
      if (ex_image) return cb(ex_image, true);

      // Otherwise insert and return the new image
      return image_db.insert(image, cb);
    });
  },

  addRemoteId: (location, remoteId, cb) => {
    const doc = {
      location,
      remoteId,
      hash: '',
      metadata: { rating: 0, tags: [] }
    };
    // since an existance check is already done to prevent duplicate downloads
    // just add the doc
    return image_db.insert(doc, cb);
  },

  delete: (id, cb) => {
    Images.get(id, (image) => {
      // Check file exists & we have write access
      if (!image.location) return cb();
      return fs.access(image.location, fs.constants.W_OK, (err) => {
        if (err) return cb(`Couldn't access ${image.location}: ${err}`);
        Sync.clearThumbnail(image.remoteId);
        return fs.unlink(image.location, cb);
      });
    });
  },

  update: (id, data, cb) => {
    image_db.updateOne({ $loki: id }, data, (doc) => {
      if (Galleries.should_save) document.dispatchEvent(gallery_update_event);
      cb(doc);
    });
  },

  remove: (id, cb) => {
    image_db.findOne({ $loki: id }, (doc) => {
      image_db.removeOne({ $loki: id }, (res) => {
        if (doc.remoteId) Sync.clearThumbnail(doc.remoteId);
        if (doc && doc.remoteId && Host.isAuthed()) {
          Sync.removeSynced(doc.remoteId, (err) => {
            if (err) cb(err);
            else cb(res);
          });
        } else cb(res);
      });
    });
  },

  removeClient: (id, cb) => image_db.removeOne({ $loki: id }, cb),

  clear: (cb) => {
    image_db.emptyCol(() => {
      image_db.save(_ => console.log('Database saved'));
      cb();
    });
  },

  download: (remoteId, gid, cb) => {
    image_db.findOne({ remoteId }, (existingDoc) => {
      if (existingDoc && existingDoc.location) {
        cb(null, existingDoc);
      } else {
        Sync.downloadImage(remoteId, gid, (err, location) => {
          if (err) console.error(err);
          else if (existingDoc) {
            Images.update(existingDoc.$loki, { location }, doc => cb(null, doc));
          } else {
            Images.addRemoteId(location, remoteId, (doc) => {
              cb(null, doc);
            });
          }
        });
      }
    });
  },

  getOrDownload: (id, gid, next) => {
    Images.getRemoteId(id, (image) => {
      if (image && image.location) {
        next(null, image, false);
      } else {
        // image not on client, download it
        Images.download(id, gid, (err, doc) => {
          if (err) {
            console.error(err);
            next(err);
          }
          next(null, doc, true);
        });
      }
    });
  }
};

// Events
document.addEventListener('vacation_loaded', () => {
  image_db = new DbConn('images');
}, false);

export default Images;
