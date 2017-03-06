import request from 'request';
import DbConn from '../helpers/db';

let group_db;
const group_update_event = new Event('group_updated');

let server_uri = 'http://127.0.0.1:';
if (process.env.SRVPORT) {
  server_uri = server_uri.concat(process.env.SRVPORT.toString());
} else {
  server_uri = server_uri.concat('3000');
}

const Groups = {
  create: (groupname, cb) => {
    const options = {
      uri: server_uri.concat('/group/create'),
      method: 'POST',
      json: { groupname }
    };
    request(options, (err, res, body) => {
      console.log("body:", body);
      if (res.status !== 200) return cb(res.status, res.error);
      // insert into clientside db
      return cb(null, res.message);
    });
  },

  switch: (groupname, cb) => {
    const options = {
      uri: server_uri.concat('/group/switch'),
      method: 'POST',
      json: { groupname }
    };
    request(options, (err, res, body) => {
      console.log("body:", body);
      if (res.status !== 200) return cb(res.status, res.error);
      // change gallery item property so it displays group tab only?
      return cb(null, res.message);
    });
  },

  delete: (gid, cb) => {
    const options = {
      uri: server_uri.concat('/group/delete'),
      method: 'POST',
      json: { gid }
    };
    request(options, (err, res, body) => {
      console.log("body:", body);
      if (res.status !== 200) return cb(res.status, res.error);
      return cb(null, res.message);
    });
  },

  getAll: (cb) => {
    const options = {
      uri: server_uri.concat('/group/'),
      method: 'GET',
      json: {}
    };
    request(options, (err, res, body) => {
      console.log("body:", body);
      if (res.status !== 200) return cb(res.status, res.error);
      // return the data and message
      return cb(null, res);
    });
  },

  inviteUser: (gid, username, cb) => {
    const options = {
      uri: server_uri.concat('/group/user/invite'),
      method: 'POST',
      json: {
        gid,
        username
      }
    };
    request(options, (err, res, body) => {
      console.log("body:", body);
      if (res.status !== 200) return cb(res.status, res.error);
      return cb(null, res.message);
    });
  },

  removeUser: (gid, username, cb) => {
    const options = {
      uri: server_uri.concat('/group/user/remove'),
      method: 'POST',
      json: {
        gid,
        username
      }
    };
    request(options, (err, res, body) => {
      console.log("body:", body);
      if (res.status !== 200) return cb(res.status, res.error);
      return cb(null, res.message);
    });
  },

  join: (gid, groupname, cb) => {
    const options = {
      uri: server_uri.concat('/group/user/join'),
      method: 'POST',
      json: {
        gid,
        groupname
      }
    };
    request(options, (err, res, body) => {
      console.log("body:", body);
      if (res.status !== 200) return cb(res.status, res.error);
      // getData or update user group view with x?
      return cb(null, res.message);
    });
  },

  refuse: (gid, groupname, cb) => {
    const options = {
      uri: server_uri.concat('/group/user/refuse'),
      method: 'POST',
      json: {
        gid,
        groupname
      }
    };
    request(options, (err, res, body) => {
      console.log("body:", body);
      if (res.status !== 200) return cb(res.status, res.error);
      // remove from user invite view
      return cb(null, res.message);
    });
  },

  getAllInvites: (cb) => {
    const options = {
      uri: server_uri.concat('/group/user/'),
      method: 'GET',
      json: {}
    };
    request(options, (err, res, body) => {
      console.log("body:", body);
      if (res.status !== 200) return cb(res.status, res.error);
      // return the succesful message and data
      return cb(null, res);
    });
  },

  getData: (gid, cb) => {
    const options = {
      uri: server_uri.concat('/group/data'),
      method: 'POST',
      json: { gid }
    };
    request(options, (err, res, body) => {
      console.log("body:", body);
      if (res.status !== 200) return cb(res.status, res.error);
      // return the succesful message and data
      return cb(null, res);
    });
  },

  addToGroup: (gid, groupdata, cb) => {
    const options = {
      uri: server_uri.concat('/group/user/remove'),
      method: 'POST',
      json: {
        gid,
        groupdata
      }
    };
    request(options, (err, res, body) => {
      console.log("body:", body);
      if (res.status !== 200) return cb(res.status, res.error);
      // update user group view with data
      return cb(null, res.message);
    });
  },

  removeFromGroup: (gid, groupdata, cb) => {
    const options = {
      uri: server_uri.concat('/group/user/remove'),
      method: 'POST',
      json: {
        gid,
        groupdata
      }
    };
    request(options, (err, res, body) => {
      console.log("body:", body);
      if (res.status !== 200) return cb(res.status, res.error);
      // update user view of group data
      return cb(null, res.message);
    });
  }
};

// Events
document.addEventListener('vacation_loaded', () => {
  group_db = new DbConn('galleries');
}, false);

document.addEventListener('group_updated', () => {
  group_db.save(_ => console.log('Database saved'));
}, false);

export default Groups;
