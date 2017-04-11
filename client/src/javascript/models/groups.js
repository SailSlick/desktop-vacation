import request from 'request';
import { map } from 'async';
import Host from './host';
import Galleries from './galleries';
import Images from './images';
import Sync from '../helpers/sync';

const server_uri = Host.server_uri;

const cookie_jar = Host.cookie_jar;

function requestHandler(err, body, cb) {
  if (!body || err) return cb(500, 'server down');
  if (body.status === 401 && body.error === 'not logged in') {
    return Host.deleteCookies(() => {
      cb(body.status, body.error);
    });
  }
  if (body.status !== 200) return cb(body.status, body.error);
  return cb(null, body.message);
}

const Groups = {
  create: (groupname, cb) => {
    if (typeof groupname !== 'string' || groupname.trim() === '') {
      return cb(400, `Invalid gallery name ${groupname}`);
    }
    return Galleries.getName(groupname, (gallery) => {
      if (gallery) return cb(400, 'You already have a gallery by that name');
      const options = {
        uri: server_uri.concat('/group/create'),
        method: 'POST',
        jar: cookie_jar,
        json: { groupname }
      };
      return request(options, (err, res, body) => {
        requestHandler(err, body, (error, msg) => {
          if (error) return cb(error, msg);
          Galleries.should_save = false;
          return Galleries.add(groupname, (doc, err_msg) => {
            Galleries.should_save = true;
            if (err_msg) return cb(500, err_msg);
            return Galleries.convertToGroup(doc.$loki, body.gid, (ret) => {
              if (ret) return cb(error, msg);
              return cb(500, 'convert To group failed');
            });
          });
        });
      });
    });
  },

  convert: (groupname, id, cb) => {
    const options = {
      uri: server_uri.concat('/group/convert'),
      method: 'POST',
      jar: cookie_jar,
      json: { groupname }
    };
    Galleries.get(id, (doc) => {
      if (!doc) return cb(404, 'Gallery not found');
      return request(options, (err, res, body) => {
        requestHandler(err, body, (error, msg) => {
          if (error) return cb(error, msg);
          return Galleries.convertToGroup(doc.$loki, body.data, (ret) => {
            if (ret) return cb(error, msg);
            return cb(500, 'convert To group failed');
          });
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
    return request(options, (err, res, body) => {
      requestHandler(err, body, (error, msg) => {
        if (error) return cb(error, msg);
        if (id !== -1) {
          return Galleries.remove(id, (err_msg) => {
            if (err_msg) return cb(500, err_msg);
            return cb(error, 'Group deleted from client and server');
          });
        }
        return cb(error, 'Group deleted');
      });
    });
  },

  get: (gid, cb) => {
    const options = {
      uri: server_uri.concat(`/group/${gid || ''}`),
      method: 'GET',
      jar: cookie_jar,
      json: true
    };
    return request(options, (err, res, body) => {
      requestHandler(err, body, (error, msg) => {
        if (error) return cb(error, msg);
        return cb(error, msg, body.data);
      });
    });
  },

  // TODO Waiting on server syncing to complete server update.
  updateMetadata: (gid, id, metadata, cb) => {
    if (id === 0) cb(null);
    else Galleries.updateMetadata(id, metadata, cb);
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
    return request(options, (err, res, body) => {
      requestHandler(err, body, (error, msg) => {
        cb(error, msg);
      });
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
    return request(options, (err, res, body) => {
      requestHandler(err, body, (error, msg) => {
        cb(error, msg);
      });
    });
  },

  leaveGroup: (gid, id, cb) => {
    Host.getIndex(1, (doc) => {
      Groups.removeUser(gid, doc.username, (err, msg) => {
        Galleries.remove(id, (ret) => {
          if (ret) return cb(500, ret);
          return cb(err, msg);
        });
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
    return request(options, (err, res, body) => {
      requestHandler(err, body, (error, msg) => {
        cb(error, msg);
      });
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
    return request(options, (err, res, body) => {
      requestHandler(err, body, (error, msg) => {
        cb(error, msg);
      });
    });
  },

  getAllInvites: (cb) => {
    const options = {
      uri: server_uri.concat('/group/user/'),
      method: 'GET',
      jar: cookie_jar,
      json: {}
    };
    return request(options, (err, res, body) => {
      requestHandler(err, body, (error, msg) => {
        if (error) return cb(error, msg);
        return cb(error, msg, body.data);
      });
    });
  },

  addToGroup: (galleryId, gid, imageIds, cb) => {
    map(imageIds, (imageId, next) =>
      Images.get(imageId, (image) => {
        if (!image) next('couldn\'t find image', null);
        if (!image.remoteId) {
          Galleries.get(1, (gallery) => {
            Sync.uploadImages(gallery.remoteId, imageId, (err, _msg, id) => {
              if (err) next(err, null);
              next(null, id);
            });
          });
        } else next(null, image.remoteId);
      }), (err, results) => {
        if (err) cb(err);
        else {
          const options = {
            uri: server_uri.concat(`/group/${gid || ''}/add`),
            method: 'POST',
            jar: cookie_jar,
            json: {
              'image-ids': JSON.stringify(results)
            }
          };
          request(options, (reqErr, res, body) => {
            requestHandler(reqErr, body, (error, msg) => {
              cb(error, msg);
            });
          });
        }
      }
    );
  },

  removeFromGroup: (galleryId, gid, imageIds, cb) => {
    const options = {
      uri: server_uri.concat(`/group/${gid || ''}/remove`),
      method: 'POST',
      jar: cookie_jar,
      json: {
        imageIds
      }
    };
    return request(options, (err, res, body) => {
      requestHandler(err, body, (error, msg) => {
        cb(error, msg);
      });
    });
  },

  // Returns:
  //   - Subgalleries with thumbnail locations
  //   - Images with full details
  expand: (gallery, filter, cb) => {
    if (!gallery) {
      cb([], []);
    } else {
      let subgalleries = gallery.subgalleries;
      const images = gallery.images;
      subgalleries = subgalleries.filter(x => x._id);
      subgalleries = subgalleries.map((x) => {
        Galleries.getMongo(x._id, (subgallery) => {
          if (subgallery) x.$loki = subgallery.$loki;
          else x.$loki = 0;
        });
        return x;
      });
      Galleries.filter(subgalleries, images, filter, cb);
    }
  }
};

export default Groups;
