import request from 'request';
import DbConn from '../helpers/db';

let host_db;
let gallery_db;
let image_db;

const gallery_update_event = new Event('gallery_updated');
const host_update_event = new Event('host_updated');
const image_update_event = new Event('image_updated');

let server_uri;
if (process.env.SRVPORT) {
  server_uri = 'http://vaca.m1cr0man.com';
} else {
  server_uri = 'http://127.0.0.1:3000';
}

request.defaults({ jar: true });
const cookie_jar = request.jar();

// Exported methods
const Host = {
  login: (username, password, cb) => {
    host_db.findOne({ username }, (host_doc) => {
      if (host_doc.username !== username) return cb('An account already exists. Only one per app.');

      // post to /user/login
      const options = {
        uri: server_uri.concat('/user/login'),
        jar: cookie_jar,
        method: 'POST',
        json: {
          username,
          password
        }
      };
      return request(options, (err, response, body) => {
        if (body.status !== 200) return cb(body.status, body.error);
        document.dispatchEvent(host_update_event);
        return cb(null, body.message);
      });
    });
  },

  logout: (cb) => {
    // post to /user/logout
    const options = {
      uri: server_uri.concat('/user/logout'),
      jar: cookie_jar,
      method: 'POST',
      json: {}
    };
    request(options, (err, response, body) => {
      if (body.status !== 200) return cb(body.status, body.error);
      document.dispatchEvent(host_update_event);
      return cb(null, body.message);
    });
  },

  isAuthed: () => {
    const cookies = cookie_jar.getCookies(server_uri);
    if (server_uri.indexOf(cookies[0].domain) > 0) return true;
    return false;
    // checks if user is logged in || session has expired
  },

  createAccount: (username, password, cb) => {
    request.defaults({ jar: true });
    host_db.findOne({ $loki: { $gt: 0 } }, (host_doc) => {
      if (host_doc) return cb(500, 'An account already exists. Only one per app.');

      // check if username has been taken online && add user server side
      const options = {
        uri: server_uri.concat('/user/create'),
        jar: cookie_jar,
        method: 'POST',
        json: {
          username,
          password
        }
      };
      return request(options, (err, response, body) => {
        if (body.status !== 200) return cb(body.status, body.error);
        // insert users
        const galname = username.concat('_all');
        const galleryData = {
          name: galname,
          tags: [],
          subgalleries: [],
          images: []
        };
        return gallery_db.insert(galleryData, (galleryDoc) => {
          if (!galleryDoc) return cb(500, "gallery couldn't be made on client");
          // insert users
          const userData = {
            username,
            gallery: galleryDoc.$loki,
            jar: cookie_jar,
            slideshowConfig: {
              onstart: false,
              galleryname: username.concat('_all'),
              timer: 0
            }
          };
          document.dispatchEvent(gallery_update_event);
          return host_db.insert(userData, (userDoc) => {
            if (!userDoc) return cb(500, "user couldn't be made on client");
            document.dispatchEvent(host_update_event);
            return cb(null, body.message);
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
      jar: cookie_jar,
      method: 'POST',
      json: {}
    };
    request(options, (err, response, body) => {
      if (body.status !== 200) return cb(body.status, body.error);

      // remove presence from client, keep images
      return host_db.emptyCol(() => {
        document.dispatchEvent(host_update_event);
        return gallery_db.emptyCol(() => {
          document.dispatchEvent(gallery_update_event);
          return image_db.emptyCol(() => {
            document.dispatchEvent(image_update_event);
            return cb(null, body.message);
          });
        });
      });
    });
  },

  updateAccount: (password, cb) => {
    // post to /user/update
    const options = {
      uri: server_uri.concat('/user/update'),
      jar: cookie_jar,
      method: 'POST',
      json: { password }
    };
    request(options, (err, response, body) => {
      if (body.status !== 200) return cb(body.status, body.error);
      document.dispatchEvent(host_update_event);
      return cb(null, body.message);
    });
  }
};

// Events
document.addEventListener('vacation_loaded', () => {
  host_db = new DbConn('host');
  gallery_db = new DbConn('galleries');
  image_db = new DbConn('images');
}, false);

document.addEventListener('host_updated', () => {
  host_db.save(_ => console.log('Host database saved'));
}, false);

document.addEventListener('gallery_updated', () => {
  gallery_db.save(_ => console.log('Gallery database saved'));
}, false);

document.addEventListener('image_updated', () => {
  image_db.save(_ => console.log('Image database saved'));
}, false);

export default Host;
