import DbConn from '../helpers/db';

let userdata_db;

const Userdata = {
  add: (username, cb) => {
    Userdata.get(username, (existing_data) => {
      if (existing_data) {
        return cb(existing_data);
      }
      return userdata_db.insert({
        username,
        gallery: username.concat('_all'),
        slideshowConfig: {
          onstart: false,
          galleryname: username.concat('_all'),
          timer: 0
        }
      }, cb);
    });
  },

  get: (username, cb) => {
    userdata_db.findOne({ username }, cb);
  },

  update: (username, data, cb) => {
    userdata_db.updateOne({ username }, data, cb);
    userdata_db.save();
  },

  remove: (username) => {
    userdata_db.removeOne({ username });
  }
};

// Events
document.addEventListener('vacation_loaded', () => {
  userdata_db = new DbConn('host');
}, false);

export default Userdata;
