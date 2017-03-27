import fs from 'fs';
import Host from './host';
import DbConn from '../helpers/db';
import Sync from '../helpers/sync';

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

  delete: (id, cb) => {
    Images.get(id, image =>
      // Check file exists & we have write access
      fs.access(image.location, fs.constants.W_OK, (err) => {
        if (err) return cb(`Couldn't access ${image.location}: ${err}`);
        return fs.unlink(image.location, cb);
      })
    );
  },

  setLocation: (id, location, cb) => {
    image_db.updateOne({ $loki: id }, { location }, () => {
      image_db.save(() => cb());
    });
  },

  setUri: (imageIds, uri, cb) => {
    image_db.updateOne({ $loki: imageIds }, { uri }, (d) => {
      console.log(d);
      image_db.save(cb);
    });
  },

  remove: (id, cb) => {
    image_db.findOne({ $loki: id }, (doc) => {
      if (doc && doc.uri && Host.isAuthed()) {
        Sync.removeSynced(doc.uri, (err) => {
          if (err) console.error(err);
        });
      }
      image_db.removeOne({ $loki: id }, cb);
    });
  },

  clear: (cb) => {
    image_db.emptyCol(() => {
      image_db.save(_ => console.log('Database saved'));
      cb();
    });
  },

  download: (remoteId, cb) => {
    const image = {
      hash: '',
      metadata: { rating: 0, tags: [] },
      uri: Host.server_uri.concat(`/image/${remoteId}`)
    };
    image_db.findOne({ uri: image.uri }, (doc) => {
      if (doc) return cb(null, doc.$loki);
      return image_db.insert(image, inserted_doc => cb(null, inserted_doc.$loki));
    });
    cb;
  }
};

// Events
document.addEventListener('vacation_loaded', () => {
  image_db = new DbConn('images');
}, false);

export default Images;
