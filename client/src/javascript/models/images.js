import fs from 'fs';
import DbConn from '../helpers/db';

let image_db;

const gallery_update_event = new Event('gallery_updated');

// Exported methods
const Images = {
  get: (id, cb) => {
    image_db.findOne({ $loki: id }, cb);
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

  remove: (id, cb) => {
    image_db.removeOne({ $loki: id }, cb);
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
  }
};

// Events
document.addEventListener('vacation_loaded', () => {
  image_db = new DbConn('images');
}, false);

export default Images;
