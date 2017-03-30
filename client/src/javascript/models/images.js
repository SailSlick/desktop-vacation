import fs from 'fs';
import Host from './host';
import DbConn from '../helpers/db';
import Sync from '../helpers/sync';
import Galleries from './galleries';

const gallery_update_event = new Event('gallery_updated');
let image_db;

// Exported methods
const Images = {
  get: (id, cb) => {
    image_db.findOne({ $loki: id }, cb);
  },

  getByUri: (uri, cb) => {
    image_db.findOne({ uri }, cb);
  },

  add: (path, cb) => {
    const doc = {
      hash: '',
      metadata: { rating: 0, tags: [] },
      location: path
    };

    // Check if it already exists
    image_db.findOne({ location: path }, (ex_doc) => {
      // If it already existed, return the existing doc
      if (ex_doc) return cb(ex_doc);

      // Otherwise insert and return the new doc
      return image_db.insert(doc, cb);
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
    Images.get(id, image =>
      // Check file exists & we have write access
      fs.access(image.location, fs.constants.W_OK, (err) => {
        if (err) return cb(`Couldn't access ${image.location}: ${err}`);
        return fs.unlink(image.location, cb);
      })
    );
  },

  update: (id, data, cb) => {
    if (Galleries.should_save) document.dispatchEvent(gallery_update_event);
    image_db.updateOne({ $loki: id }, data, () => cb());
  },

  remove: (id, cb) => {
    image_db.findOne({ $loki: id }, (doc) => {
      if (doc && doc.remoteId && Host.isAuthed()) {
        Sync.removeSynced(doc.remoteId, (err) => {
          if (err) console.error(err);
        });
      }
      image_db.removeOne({ $loki: id }, cb);
    });
  },

  updateMetadata: (id, metadata, cb) => {
    image_db.updateOne({ $loki: id }, metadata, (doc) => {
      document.dispatchEvent(gallery_update_event);
      cb(doc);
    });
  },

  clear: (cb) => {
    image_db.emptyCol(() => {
      image_db.save(_ => console.log('Database saved'));
      cb();
    });
  },

  download: (remoteId, cb) => {
    image_db.findOne({ remoteId }, (existingDoc) => {
      if (existingDoc) {
        cb(null, existingDoc.$loki);
      } else {
        Sync.downloadImage(remoteId, (err, location) => {
          if (err) console.error(err);
          else {
            console.log(`Adding image at ${location}`);
            Images.addRemoteId(location, remoteId, (doc) => {
              cb(null, doc.$loki);
            });
          }
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
