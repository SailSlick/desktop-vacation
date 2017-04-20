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

  delete: (remoteId, id, cb) => {
    const options = {
      uri: server_uri.concat('/group/delete'),
      method: 'POST',
      jar: cookie_jar,
      json: { gid: remoteId }
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
      if (!subgal.thumbnail) {
        subgal.thumbnail = null;
        // get thumbnail
        if (subgal.images && subgal.images.length !== 0) {
          Images.getOrDownload(subgal.images[0], subgal.remoteId, (thumbErr, image) => {
            if (image) {
              subgal.thumbnail = image.location;
              Galleries.addItem(group.$loki, image.$loki, () => galNext(null, subgal));
            }
          });
        } else galNext(null, subgal);
      } else galNext(null, subgal);
    }, (galMapErr, galResults) => {
      // group.subgalleries = galResults;
      map(group.images, (id, next) => {
        Images.getOrDownload(id, group.remoteId, (getErr, image, download) => {
          if (download) downloads = true;
          if (typeof id !== 'number') Galleries.addItem(group.$loki, image.$loki, () => next(getErr, image));
        });
      }, (mapErr, result) => {
        if (mapErr) warning(error);
        Galleries.should_save = true;
        if (downloads) document.dispatchEvent(Galleries.gallery_update_event);
        // if (downloads && group.$loki) {
        //   Galleries.update(group.$loki, { images: group.images }, (updatedGroup) => {
        //     cb(error, msg, updatedGroup);
        //   });
        // }
        // group.images = result;
        const toReturn = { subgalleries: galResults, images: result, $loki: group.$loki };
        cb(error, msg, toReturn);
      });
    });
  },

  get: (gid, offline, cb) => {
    if (!offline) {
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
            if (gid) {
              Galleries.getMongo(group.remoteId, (cliGroup) => {
                if (!cliGroup) {
                  Galleries.add(group.name, (addedGallery) => {
                    Galleries.convertToGroup(
                      addedGallery.$loki,
                      group.remoteId,
                      (convertedGroup) => {
                        group.$loki = convertedGroup.$loki;
                        Groups.getGroupImages(group, error, msg, cb);
                      });
                  });
                } else {
                  group.$loki = cliGroup.$loki;
                  Groups.getGroupImages(group, error, msg, cb);
                }
              });
            } else {
              Groups.getGroupImages(group, error, msg, cb);
            }
          }
        });
      });
    }
    // check if you want a specific offline group
    if (gid) {
      return Galleries.getMongo(gid, (group) => {
        cb(null, null, group);
      });
    }
    // go through the db and check for groups that are offline/downloaded
    return Galleries.groupOfflineGet((groups) => {
      if (groups.length === 0) cb('No offline groups', null, null);
      const allGroups = { subgalleries: groups, images: [] };
      cb(null, null, allGroups);
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
    Host.getIndex(Host.userId, (doc) => {
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
      Images.get(id, () => {
        Images.update(id, { remoteId: null }, () => {
          Galleries.addItem(Galleries.BASE_GALLERY_ID, id, (success, errMsg) => {
            if (!success) next(errMsg);
            else next();
          });
        });
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
    const clientIds = imageIds;
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
                Galleries.get(Galleries.BASE_GALLERY_ID, (gallery) => {
                  Galleries.should_save = false;
                  map(clientIds, (rmId, next) => {
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

  convertToOffline: (group, cb) => {
    Galleries.update(group.$loki, { offline: true }, (doc) => {
      if (!doc) cb('Update to Offline failed');
      else {
        Groups.save(doc.Images, (saveErr) => {
          if (saveErr) cb(saveErr);
          else cb();
        });
      }
    });
  },

  downloadGroup: (gid, cb) => {
    Groups.get(gid, false, (err, res, dlGroup) => {
      if (err) {
        console.error(`group get ${err}: ${res}`);
        cb('Download failed');
      // group has been downloaded in full quality, change to offline, save all images
      } else Groups.convertToOffline(dlGroup, cb);
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
      subgalleries = subgalleries.filter(x => x.remoteId);
      subgalleries = subgalleries.map((x) => {
        Galleries.getMongo(x.remoteId, (subgallery) => {
          if (subgallery) {
            x.$loki = subgallery.$loki;
          } else {
            x.$loki = 0;
          }
        });
        return x;
      });
      if (typeof gallery.images[0] === 'number') {
        map(gallery.images, (image_id, next) => Images.get(image_id, image => next(null, image)),
          (err_img, images) => {
            Galleries.filter(subgalleries, images, filter, cb);
          }
        );
      } else Galleries.filter(subgalleries, gallery.images, filter, cb);
    }
  }
};

export default Groups;
