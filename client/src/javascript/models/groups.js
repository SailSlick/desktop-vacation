import request from 'request';
import { map, eachOf } from 'async';
import Host from './host';
import Galleries from './galleries';
import Images from './images';
import Sync from '../helpers/sync';
import { warning } from '../helpers/notifier';

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

  getGroupImages: (group, error, msg, cb) => {
    let downloads = false;
    Galleries.should_save = false;

    map(group.subgalleries, (subgal, galNext) => {
      subgal.thumbnail = null;
      // get thumbnail
      if (subgal.images && subgal.images.length !== 0) {
        Images.getOrDownload(subgal.images[0], group._id, (thumbErr, image) => {
          if (image) {
            subgal.thumbnail = image.location;
            galNext(null, subgal);
          }
        });
      } else galNext(null, subgal);
    }, (galMapErr, galResults) => {
      group.subgalleries = galResults;
      map(group.images, (id, next) => {
        Images.getOrDownload(id, group._id, (getErr, image, download) => {
          if (download) downloads = true;
          next(getErr, image);
        });
      }, (mapErr, result) => {
        if (mapErr) warning(error);
        group.images = result;
        Galleries.should_save = true;
        if (downloads) document.dispatchEvent(Galleries.gallery_update_event);
        cb(error, msg, group);
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
        if (error) cb(error, msg);
        else {
          const group = body.data;
          Galleries.getMongo(group._id, (cliGroup) => {
            if (!cliGroup) {
              Galleries.add(group.name, (addedGallery) => {
                Galleries.convertToGroup(addedGallery.$loki, group._id, (convertedGroup) => {
                  group.$loki = convertedGroup.$loki;
                  Groups.getGroupImages(group, error, msg, cb);
                });
              });
            } else {
              group.$loki = cliGroup.$loki;
              Groups.getGroupImages(group, error, msg, cb);
            }
          });
        }
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

  save: (imageIds, cb) => {
    Galleries.should_save = false;
    eachOf(imageIds, (id, key, next) => {
      if (key === imageIds.length - 1) Galleries.should_save = true;
      Galleries.addItem(1, id, (success, errMsg) => {
        if (!success) next(errMsg);
        else next();
      });
    }, (err) => {
      if (err) cb(err);
      else cb(null, 'All images saved');
    });
  },

  addToGroup: (gid, imageIds, cb) => {
    Galleries.getMongo(gid, (group) => {
      imageIds = imageIds.filter(id => group.images.indexOf(id) === -1);
      Sync.uploadImages(imageIds, (ids) => {
        const options = {
          uri: server_uri.concat(`/group/${gid || ''}/add`),
          method: 'POST',
          jar: cookie_jar,
          json: {
            'image-ids': JSON.stringify(ids)
          }
        };
        request(options, (reqErr, res, body) => {
          requestHandler(reqErr, body, (error, msg) => {
            cb(error, msg);
          });
        });
      });
    });
  },

  removeFromGroup: (gid, imageIds, cb) => {
    map(imageIds, (id, next) => {
      Images.get(id, (image) => {
        if (!image) next('image not found');
        else next(null, image.remoteId);
      });
    }, (err, result) => {
      if (err) cb(err, 'remove failed');
      else {
        Galleries.getMongo(gid, (group) => {
          imageIds = imageIds.filter(id => group.images.indexOf(id) === -1);
          const options = {
            uri: server_uri.concat(`/group/${gid || ''}/remove`),
            method: 'POST',
            jar: cookie_jar,
            json: {
              'image-ids': JSON.stringify(result)
            }
          };
          request(options, (reqErr, res, body) => {
            requestHandler(reqErr, body, (error, msg) => {
              if (error) cb(error, msg);
              else {
                // check if in base gallery, If not remove from fs
                Galleries.get(1, (gallery) => {
                  Galleries.should_save = false;
                  map(imageIds, (rmId, next) => {
                    if (gallery.images.indexOf(rmId) === -1) {
                      Galleries.deleteGroupItem(group.$loki, rmId, (delErr) => {
                        if (delErr) next(delErr);
                        else next();
                      });
                    } else {
                      Galleries.removeItem(group.$loki, rmId, (data, rmErr) => {
                        if (err) next(rmErr);
                        else next();
                      });
                    }
                  }, (mapErr) => {
                    Galleries.should_save = true;
                    if (mapErr) cb(mapErr, 'removed from server but not client');
                    else {
                      document.dispatchEvent(Galleries.gallery_update_event);
                      cb(null, msg);
                    }
                  });
                });
              }
            });
          });
        });
      }
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
      subgalleries = subgalleries.filter(x => x._id);
      subgalleries = subgalleries.map((x) => {
        Galleries.getMongo(x._id, (subgallery) => {
          if (subgallery) {
            x.$loki = subgallery.$loki;
          } else {
            x.$loki = 0;
          }
        });
        return x;
      });
      Galleries.filter(subgalleries, gallery.images, filter, cb);
    }
  }
};

export default Groups;
