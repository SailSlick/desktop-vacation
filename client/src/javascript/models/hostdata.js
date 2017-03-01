import DbConn from '../helpers/db';

let hostdata_db;

const Hostdata = {
  get: (username, cb) => {
    hostdata_db.findOne({ username }, cb);
  },

  update: (username, data, cb) => {
    hostdata_db.updateOne({ username }, data, cb);
    hostdata_db.save();
  }
};

// Events
document.addEventListener('vacation_loaded', () => {
  hostdata_db = new DbConn('host');
}, false);

export default Hostdata;
