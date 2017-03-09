import request from 'request';
import Host from './host';
import Galleries from './galleries';

let server_uri = 'http://127.0.0.1:';
if (process.env.SRVPORT) {
  server_uri = server_uri.concat(process.env.SRVPORT.toString());
} else {
  server_uri = server_uri.concat('3000');
}

const cookie_jar = Host.cookie_jar;

const Groups = {
  create: (groupname, cb) => {
    if (!groupname || typeof groupname !== 'string' || groupname.trim() === '' || groupname.indexOf(' ') !== -1) {
      return cb(400, `Invalid gallery name ${groupname}`);
    }
    const options = {
      uri: server_uri.concat('/group/create'),
      method: 'POST',
      jar: cookie_jar,
      json: { groupname }
    };
    return request(options, (err, res, body) => {
      if (!body) return cb(500, 'server down');
      if (body.status === 401) {
        return Host.deleteCookies(body.status, body.error, (cookieErr, cookieMsg) => {
          cb(cookieErr, cookieMsg);
        });
      }
      if (body.status !== 200) return cb(body.status, body.error);
      return Galleries.add(groupname, (doc, err_msg) => {
        if (err_msg) return cb(500, err_msg);
        return Galleries.convertToGroup(doc.$loki, body.data, (ret) => {
          if (ret) return cb(null, body.message);
          return cb(500, 'convert To group failed');
        });
      });
    });
  },

  switch: (groupname, id, cb) => {
    const options = {
      uri: server_uri.concat('/group/switch'),
      method: 'POST',
      jar: cookie_jar,
      json: { groupname }
    };
    Galleries.get(id, (doc) => {
      if (!doc) return cb(404, 'Gallery not found');
      return request(options, (err, res, body) => {
        if (!body) return cb(500, 'server down');
        if (body.status === 401) {
          return Host.deleteCookies(body.status, body.error, (cookieErr, cookieMsg) => {
            cb(cookieErr, cookieMsg);
          });
        }
        if (body.status !== 200) return cb(body.status, body.error);
        return Galleries.convertToGroup(doc.$loki, body.data, (ret) => {
          if (ret) return cb(null, body.message);
          return cb(500, 'convert To group failed');
        });
      });
    });
  },

  delete: (mongoId, id, cb) => {
    const options = {
      uri: server_uri.concat('/group/delete'),
      method: 'POST',
      jar: cookie_jar,
      json: { gid: mongoId }
    };
    request(options, (err, res, body) => {
      if (!body) return cb(500, 'server down');
      if (body.status === 401) {
        return Host.deleteCookies(body.status, body.error, (cookieErr, cookieMsg) => {
          cb(cookieErr, cookieMsg);
        });
      }
      if (body.status !== 200) return cb(body.status, body.error);
      if (mongoId !== id) {
        return Galleries.remove(id, (err_msg) => {
          if (err_msg) return cb(500, err);
          return cb(null, body.message);
        });
      }
    });
  },

  get: (gid, cb) => {
    const options = {
      uri: server_uri.concat(`/group/${gid || ''}`),
      method: 'GET',
      jar: cookie_jar,
      json: true
    };
    request(options, (err, res, body) => {
      if (!body) return cb(500, 'server down', null);
      if (body.status === 401) {
        return Host.deleteCookies(body.status, body.error, (cookieErr, cookieMsg) => {
          cb(cookieErr, cookieMsg);
        });
      }
      if (body.status !== 200) return cb(body.status, body.error, null);
      return cb(null, body.message, body.data);
    });
  },

  inviteUser: (gid, username, cb) => {
    const options = {
      uri: server_uri.concat('/group/user/invite'),
      method: 'POST',
      jar: cookie_jar,
      json: {
        gid,
        username
      }
    };
    request(options, (err, res, body) => {
      if (!body) return cb(500, 'server down');
      if (body.status === 401) {
        return Host.deleteCookies(body.status, body.error, (cookieErr, cookieMsg) => {
          cb(cookieErr, cookieMsg);
        });
      }
      if (body.status !== 200) return cb(body.status, body.error);
      return cb(null, body.message);
    });
  },

  removeUser: (gid, username, cb) => {
    const options = {
      uri: server_uri.concat('/group/user/remove'),
      method: 'POST',
      jar: cookie_jar,
      json: {
        gid,
        username
      }
    };
    request(options, (err, res, body) => {
      if (!body) return cb(500, 'server down');
      if (body.status === 401) {
        return Host.deleteCookies(body.status, body.error, (cookieErr, cookieMsg) => {
          cb(cookieErr, cookieMsg);
        });
      }
      if (body.status !== 200) return cb(body.status, body.error);
      return cb(null, body.message);
    });
  },

  leaveGroup: (gid, cb) => {
    Host.getIndex(1, (doc) => {
      Groups.removeUser(gid, doc.username, (err, msg) => {
        cb(err, msg);
      });
    });
  },

  join: (gid, groupname, cb) => {
    const options = {
      uri: server_uri.concat('/group/user/join'),
      method: 'POST',
      jar: cookie_jar,
      json: {
        gid,
        groupname
      }
    };
    request(options, (err, res, body) => {
      if (!body) return cb(500, 'server down');
      if (body.status === 401) {
        return Host.deleteCookies(body.status, body.error, (cookieErr, cookieMsg) => {
          cb(cookieErr, cookieMsg);
        });
      }
      if (body.status !== 200) return cb(body.status, body.error);
      // TODO getData or update user group view with x?
      return cb(null, body.message);
    });
  },

  refuse: (gid, groupname, cb) => {
    const options = {
      uri: server_uri.concat('/group/user/refuse'),
      method: 'POST',
      jar: cookie_jar,
      json: {
        gid,
        groupname
      }
    };
    request(options, (err, res, body) => {
      if (!body) return cb(500, 'server down');
      if (body.status === 401) {
        return Host.deleteCookies(body.status, body.error, (cookieErr, cookieMsg) => {
          cb(cookieErr, cookieMsg);
        });
      }
      if (body.status !== 200) return cb(body.status, body.error);
      // TODO remove invite from user list
      return cb(null, body.message);
    });
  },

  getAllInvites: (cb) => {
    const options = {
      uri: server_uri.concat('/group/user/'),
      method: 'GET',
      jar: cookie_jar,
      json: {}
    };
    request(options, (err, res, body) => {
      if (!body) return cb(500, 'server down', null);
      if (body.status === 401) {
        return Host.deleteCookies(body.status, body.error, (cookieErr, cookieMsg) => {
          cb(cookieErr, cookieMsg);
        });
      }
      if (body.status !== 200) return cb(body.status, body.error, null);
      return cb(null, body.message, body.data);
    });
  },

  addToGroup: (gid, groupdata, cb) => {
    const options = {
      uri: server_uri.concat('/group/data/add'),
      method: 'POST',
      jar: cookie_jar,
      json: {
        gid,
        groupdata
      }
    };
    request(options, (err, res, body) => {
      if (!body) return cb(500, 'server down');
      if (body.status === 401) {
        return Host.deleteCookies(body.status, body.error, (cookieErr, cookieMsg) => {
          cb(cookieErr, cookieMsg);
        });
      }
      if (body.status !== 200) return cb(body.status, body.error);
      // Update group view
      return cb(null, body.message);
    });
  },

  removeFromGroup: (gid, groupdata, cb) => {
    const options = {
      uri: server_uri.concat('/group/data/remove'),
      method: 'POST',
      jar: cookie_jar,
      json: {
        gid,
        groupdata
      }
    };
    request(options, (err, res, body) => {
      if (!body) return cb(500, 'server down');
      if (body.status === 401) {
        return Host.deleteCookies(body.status, body.error, (cookieErr, cookieMsg) => {
          cb(cookieErr, cookieMsg);
        });
      }
      if (body.status !== 200) return cb(body.status, body.error);
      // update group view
      return cb(null, body.message);
    });
  },

  // Returns:
  //   - Subgalleries with thumbnail locations
  //   - Images with full details
  expand: (gallery, cb) => {
    console.log(gallery);
    cb(gallery.subgalleries, gallery.images);
  }
};

export default Groups;
