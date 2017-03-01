import DbConn from '../helpers/db';

let image_db;

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

  remove: (id) => {
    image_db.removeOne({ $loki: id });
    console.log(`Removed image ${id}`);
    return 0;
  }
};

// Events
document.addEventListener('vacation_loaded', () => {
  image_db = new DbConn('images');
}, false);

export default Images;
