import request from 'request';
import DbConn from '../helpers/db';
import Images from './images';
import Galleries from './galleries';

let host_db;

const host_update_event = new Event('host_updated');

let server_uri;
if (process.env.SRVPORT) {
  server_uri = 'http://vaca.m1cr0man.com';
} else {
  server_uri = 'http://127.0.0.1:3000';
}

const cookie_jar = request.jar();

function createClientAccount(username, successMessage, cb) {
  // insert users
  const galname = username.concat('_all');
  Galleries.addBase(galname, (ret) => {
    if (!ret) return cb(500, "gallery couldn't be made on client");
    // insert users
    const userData = {
      username,
      gallery: ret,
      slideshowConfig: {
        onstart: false,
        galleryname: username.concat('_all'),
        timer: 0
      }
    };
    return host_db.insert(userData, (userDoc) => {
      if (!userDoc) return cb(500, "user couldn't be made on client");
      document.dispatchEvent(host_update_event);
      return cb(null, successMessage);
    });
  });
}

function deleteCookies(errCode, msg, cb) {
  const cookies = cookie_jar.getCookies(server_uri);
  if (cookies.length === 0) return cb(errCode, msg);
  // remove cookie from jar
  // eslint-disable-next-line dot-notation
  return cookie_jar['_jar'].store.removeCookie(cookies[0].domain,
    cookies[0].path,
    cookies[0].key, () => {
      console.log('cookie deleted');
      return cb(errCode, msg);
    });
}

// Exported methods
const Host = {

  login: (username, password, cb) => {
    host_db.findOne({}, (host_doc) => {
      if (host_doc && host_doc.username !== username) return cb(500, 'An account already exists. Only one per app.');

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
        body = body || { status: 500, error: 'server down' };
        if (body.status !== 200) {
          return deleteCookies(body.status, body.error, (cookieErr, cookieMsg) => {
            cb(cookieErr, cookieMsg);
          });
        }
        if (!host_doc) {
          console.log('Create client side account for prev account.');
          return createClientAccount(username, body.message, (msg_err, msg) => {
            cb(msg_err, msg);
          });
        }
        host_doc.jar = cookie_jar.getCookies(server_uri);
        return host_db.updateOne({ username }, host_doc, (ret) => {
          if (ret) return cb(null, body.message);
          return cb(500, "user couldn't be made on client");
        });
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
      if (!body) return cb(500, 'server down');
      if (body.status !== 200) return cb(body.status, body.error);
      return deleteCookies(null, body.message, (cookieErr, cookieMsg) => {
        cb(cookieErr, cookieMsg);
      });
    });
  },

  isAuthed: (cb) => {
    // checks if user is logged in || session has expired
    const cookies = cookie_jar.getCookies(server_uri);
    if (cookies.length === 0) return cb(false);
    return cb(true);
  },

  createAccount: (username, password, cb) => {
    host_db.findOne({}, (host_doc) => {
      if (host_doc) return cb(500, 'An account already exists. Only one per app.');
      const options = {
        uri: server_uri.concat('/user/create'),
        method: 'POST',
        jar: cookie_jar,
        json: {
          username,
          password
        }
      };
      return request(options, (err, response, body) => {
        body = body || { status: 500, error: 'server down' };
        if (body.status !== 200) {
          return deleteCookies(body.status, body.error, (cookieErr, cookieMsg) => {
            cb(cookieErr, cookieMsg);
          });
        }
        return createClientAccount(username, body.message, (msg_err, msg) => {
          cb(msg_err, msg);
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
      if (!body) return cb(500, 'server down');
      if (body.status !== 200) return cb(body.status, body.error);
      // remove cookie from jar
      return deleteCookies(null, body.message, (cookieErr, cookieMsg) => {
        // remove presence from client, keep images
        host_db.emptyCol(() => {
          document.dispatchEvent(host_update_event);
          return Galleries.clear(() => {
            Images.clear(() => {
              cb(cookieErr, cookieMsg);
            });
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
      if (!body) return cb(500, 'server down');
      if (body.status !== 200) return cb(body.status, body.error);
      document.dispatchEvent(host_update_event);
      return cb(null, body.message);
    });
  },

  clear: (cb) => {
    host_db.emptyCol(() => {
      document.dispatchEvent(host_update_event);
      cb();
    });
  },

  get: (username, cb) => {
    host_db.findOne({ username }, cb);
  },

  getIndex: (index, cb) => {
    host_db.findIndex(index, cb);
  },

  update: (query, data, cb) => {
    host_db.updateOne(query, data, cb);
  },

  remove: (username) => {
    host_db.removeOne({ username }, _ => true);
  }
};

// Events
document.addEventListener('vacation_loaded', () => {
  host_db = new DbConn('host');
}, false);

document.addEventListener('host_updated', () => {
  host_db.save(_ => console.log('Host database saved'));
}, false);

export default Host;
