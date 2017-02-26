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
    const query = { location: path };
    image_db.findOne(query, (ex_doc) => {
      // If it already existed, return the existing doc
      if (ex_doc) cb(ex_doc);

      // Otherwise insert and return the new doc
      image_db.insert(doc, cb);
    });
  },

  remove: (path) => {
    image_db.removeOne({ location: path });
    console.log(`Removed image ${path}`);
    return 0;
  }
};

// Events
document.addEventListener('vacation_loaded', () => {
  image_db = new DbConn('images');
}, false);

export default Images;
