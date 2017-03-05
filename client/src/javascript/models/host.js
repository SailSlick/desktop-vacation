import request from 'request';
import DbConn from '../helpers/db';

let host_db;
let gallery_db;

const host_update_event = new Event('host_updated');
let server_uri = 'http://127.0.0.1:';
if (process.env.SRVPORT) {
  server_uri = server_uri.concat(process.env.SRVPORT.toString());
} else {
  server_uri = server_uri.concat('3000');
}

// Exported methods
const Host = {
  login: (username, password, cb) => {
    host_db.findOne({ username }, (host_doc) => {
      if (!host_doc) return cb('user doesn\'t exist');

      // post to /user/login
      const options = {
        uri: server_uri.concat('/user/login'),
        method: 'POST',
        json: {
          username,
          password
        }
      };
      return request(options, (err, response, body) => {
        console.log("body:", body);
        if (response.status !== 200) return cb(response.status, response.error);
        document.dispatchEvent(host_update_event);
        return cb(null, response.message);
      });
    });
  },

  logout: (cb) => {
    // post to /user/logout
    const options = {
      uri: server_uri.concat('/user/logout'),
      method: 'POST',
      json: {}
    };
    request(options, (err, response, body) => {
      console.log("body:", body);
      if (response.status !== 200) return cb(response.status, response.error);
      document.dispatchEvent(host_update_event);
      return cb(null, response.message);
    });
  },

  isAuthed: () => {
    // checks if user is logged in || session has expired
    return true;
  },

  createAccount: (username, password, cb) => {
    host_db.findOne({ $loki: { $gt: 0 } }, (host_doc) => {
      if (host_doc) return cb('An account already exists. Only one per app.');

      // check if username has been taken online && add user server side
      const options = {
        uri: server_uri.concat('/user/create'),
        method: 'POST',
        json: {
          username,
          password
        }
      };
      request(options, (err, response, body) => {
        console.log("body:", body);
        if (response.status !== 200) return cb(response.status, response.error);
        document.dispatchEvent(host_update_event);
        return cb(null, response.message);
      });

      // create base gallery
      const galleryData = {
        name: username.concat('_all'),
        tags: [],
        subgalleries: [],
        images: []
      };
      return gallery_db.insert(galleryData, (mainGal) => {
        gallery_db.save(() => {
          // add host to host db
          const hostData = {
            username,
            gallery: mainGal.$loki,
            slideshowConfig: {
              onstart: false,
              galleryname: username.concat('_all'),
              timer: 0
            }
          };
          host_db.insert(hostData, (ret) => {
            if (ret.username !== username) return cb('adding to host db failed');
            document.dispatchEvent(host_update_event);
            return cb(null);
          });
        });
      });
    });
  },

  deleteAccount: (password, cb) => {
    // check pw again

    // post to /user/delete
    const options = {
      uri: server_uri.concat('/user/delete'),
      method: 'POST',
      json: {}
    };
    request(options, (err, response, body) => {
      console.log("body:", body);
      if (response.status !== 200) return cb(response.status, response.error);
      document.dispatchEvent(host_update_event);
      return cb(null, response.message);
    });
  },

  updateAccount: (password, cb) => {
    // post to /user/update
    const options = {
      uri: server_uri.concat('/user/update'),
      method: 'POST',
      json: { password }
    };
    request(options, (err, response, body) => {
      console.log("body:", body);
      if (response.status !== 200) return cb(response.status, response.error);
      document.dispatchEvent(host_update_event);
      return cb(null, response.message);
    });
  }
};

// Events
document.addEventListener('vacation_loaded', () => {
  host_db = new DbConn('host');
  gallery_db = new DbConn('galleries');
}, false);

document.addEventListener('host_updated', () => {
  host_db.save(_ => console.log('Host database saved'));
}, false);

export default Host;
