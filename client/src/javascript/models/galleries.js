import { map, each, eachOf } from 'async';
import { ipcRenderer as ipc } from 'electron';
import request from 'request';
import Host from './host';
import DbConn from '../helpers/db';
import Images from './images';

let gallery_db;

let BASE_GALLERY_ID = 1;

const gallery_update_event = new Event('gallery_updated');

const Galleries = {
  should_save: true,

  addBase: (name, remoteId, cb) => {
    gallery_db.findOne({ name }, (found_gallery) => {
      if (found_gallery) {
        console.error(`Gallery ${name} already exists`);
        return cb(found_gallery);
      }
      const doc = {
        name,
        remoteId,
        tags: [],
        subgalleries: [],
        images: []
      };
      return gallery_db.insert(doc, (inserted_gallery) => {
        BASE_GALLERY_ID = inserted_gallery.$loki;
        return cb(inserted_gallery.$loki);
      });
    });
  },

  add: (name, cb) => {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return cb(null, `Invalid gallery name ${name}`);
    }
    return gallery_db.findOne({ name }, (found_gallery) => {
      if (found_gallery) {
        return cb(found_gallery, `Gallery ${name} already exists`);
      }
      const doc = {
        name,
        group: false,
        tags: [],
        subgalleries: [],
        images: []
      };
      return gallery_db.insert(doc, (inserted_gallery) => {
        const id = inserted_gallery.$loki;
        // addSubgallery will dispatch the event
        Galleries.addSubGallery(BASE_GALLERY_ID, id, () =>
          cb(inserted_gallery)
        );
      });
    });
  },

  convertToGroup: (id, mongoId, cb) => {
    gallery_db.updateOne({ $loki: id }, {
      group: true,
      mongoId
    }, (ret) => {
      if (Galleries.should_save) document.dispatchEvent(gallery_update_event);
      cb(ret);
    });
  },

  addSubGallery: (id, subgallery_id, cb) => {
    if (id === subgallery_id) {
      return cb(null, `Tried to add gallery ${id} to itself`);
    }
    if (subgallery_id === BASE_GALLERY_ID) {
      return cb(null, `Tried to add base gallery to ${id}`);
    }
    return Galleries.get(id, (base_gallery) => {
      if (!base_gallery) {
        return cb(null, `No such gallery ${id}`);
      } else if (base_gallery.subgalleries.indexOf(subgallery_id) !== -1) {
        return cb(base_gallery, `Gallery ${subgallery_id} is already a subgallery of ${id}`);
      }
      base_gallery.subgalleries.push(subgallery_id);
      return gallery_db.updateOne(
        { $loki: id },
        { subgalleries: base_gallery.subgalleries },
        (updated_gallery) => {
          if (Galleries.should_save) document.dispatchEvent(gallery_update_event);
          return cb(updated_gallery);
        }
      );
    });
  },

  addItem: (id, image_id, cb) => {
    console.log(`Adding image_id ${image_id} to gallery ${id}`);
    return Galleries.get(id, (gallery) => {
      if (gallery === null) {
        return cb(null, 'Cannot find gallery');
      } else if (gallery.images.indexOf(image_id) !== -1) {
        return cb(gallery, 'Tried to add duplicate image');
      }
      gallery.images.push(image_id);
      return gallery_db.updateOne({ $loki: id }, gallery, (new_gallery) => {
        if (Galleries.should_save) document.dispatchEvent(gallery_update_event);
        return cb(new_gallery);
      });
    });
  },

  get: (id, cb) => gallery_db.findOne({ $loki: id }, cb),

  getMongo: (id, cb) => gallery_db.findOne({ mongoId: id }, cb),

  // Returns:
  //   - Subgalleries with thumbnail locations
  //   - Images with full details
  expand: (gallery, cb) => {
    // Expand Subgalleries
    map(gallery.subgalleries, (id, next) =>
      Galleries.get(id, (subgallery) => {
        // get thumbnail
        if (subgallery.images.length !== 0) {
          Images.get(
            subgallery.images[0],
            (image) => {
              subgallery.thumbnail = image.location;
              next(null, subgallery);
            }
          );
        } else {
          // Make sure thumbnail is null before returning
          subgallery.thumbnail = null;
          next(null, subgallery);
        }
      }),
    (err_gal, subgalleries) =>
      // Expand Images
      map(gallery.images, (image_id, next) =>
          Images.get(image_id, image => next(null, image)),
        (err_img, images) => {
          subgalleries = subgalleries.filter(x => !x.group);
          cb(subgalleries, images);
        }
      )
    );
  },

  remove: (id, cb) => {
    console.log('Removing gallery:', id);
    if (id === BASE_GALLERY_ID) {
      return cb('Tried to delete base gallery');
    }

    return gallery_db.findMany({ subgalleries: { $contains: id } }, references =>
      each(references, (ref, next) => {
        ref.subgalleries = ref.subgalleries.filter(i => i !== id);
        gallery_db.updateOne(
          { $loki: ref.$loki },
          ref.subgalleries,
          () => {
            console.log(`- ${ref.$loki} no longer contains reference to ${id}`);
            next();
          }
        );
      }, () =>
        gallery_db.removeOne({ $loki: id }, () => {
          if (Galleries.should_save) document.dispatchEvent(gallery_update_event);
          cb();
        })
      )
    );
  },

  removeItem: (id, item_id, cb) => {
    console.log(`Attempting to remove ${item_id} from ${id}`);
    if (id === BASE_GALLERY_ID) {
      return Galleries.removeItemGlobal(item_id, cb);
    }
    return Galleries.get(id, (gallery) => {
      if (gallery === null) {
        return cb(null, `${id} not found`);
      }
      gallery.images = gallery.images.filter(i => i !== item_id);
      return gallery_db.updateOne({ $loki: id }, gallery, (new_gallery) => {
        console.log('Item removed');
        if (Galleries.should_save) document.dispatchEvent(gallery_update_event);
        return cb(new_gallery);
      });
    });
  },

  deleteItem: (id, cb) => {
    console.log(`Deleting ${id} from db and fs`);
    Images.delete(id, (err_msg) => {
      if (err_msg) return cb(err_msg);
      return Galleries.removeItemGlobal(id, cb);
    });
  },

  // Removes an image from all the galleries it was in
  removeItemGlobal: (id, cb) => {
    console.log('Globally removing image:', id);
    Images.remove(id, () =>
      gallery_db.findMany({ images: { $contains: id } }, refs =>
        each(refs, (gallery, next) => {
          gallery.images = gallery.images.filter(i => i !== id);
          gallery_db.updateOne({ $loki: gallery.$loki }, gallery, () => {
            console.log(`- ${gallery.$loki} no longer contains reference to ${id}`);
            next();
          });
        }, () => {
          console.log('Item removed globally');
          if (Galleries.should_save) document.dispatchEvent(gallery_update_event);
          cb();
        })
      )
    );
  },

  clear: (cb) => {
    gallery_db.emptyCol(() => {
      if (Galleries.should_save) document.dispatchEvent(gallery_update_event);
      cb();
    });
  },

  addRemoteId: (gid, remoteId, cb) => {
    console.log(`adding remote: ${remoteId}`);
    gallery_db.updateOne({ $loki: gid }, { remoteId }, cb);
  },

  syncRoot: () => {
    Host.getIndex(Host.userId, (userData) => {
      if (!userData) {
        console.error('User data doesn\'t exist.');
        console.error('Kernel panic - not syncing. Attempted to kill init');
        return;
      }
      const options = {
        uri: Host.server_uri.concat(`/gallery/${userData.remoteGallery}`),
        jar: Host.cookie_jar,
        method: 'GET',
        json: true
      };
      request(options, (err, response, body) => {
        if (response.statusCode !== 200 || !body.data.images) {
          console.error(`Failure to sync, code: ${response.statusCode}`);
          console.error(body.error);
          return;
        } else if (body.data.images.length === 0) {
          console.log('No images to sync');
          return;
        }
        map(body.data.images, Images.download, (downloadErr, imageIds) => {
          if (downloadErr) console.error(downloadErr);
          each(imageIds,
            (id, cb) => {
              Galleries.addItem(BASE_GALLERY_ID, id, (addErr, _res) => {
                if (addErr) cb(err);
                else cb();
              });
            },
            (addErr) => {
              if (addErr) console.error(addErr);
            }
          );
        });
      });
    });
  }
};

// Events
document.addEventListener('vacation_loaded', () => {
  gallery_db = new DbConn('galleries');
}, false);

document.addEventListener('gallery_updated', () =>
  gallery_db.save(_ => console.log('Database saved')),
false);

document.addEventListener('sync_root', Galleries.syncRoot, false);

// IPC Calls
ipc.on('selected-directory', (event, files) => {
  Galleries.should_save = false;
  eachOf(files, (file, index, next) => {
    if (index === files.length - 1) Galleries.should_save = true;
    Images.add(file, image =>
      Galleries.addItem(BASE_GALLERY_ID, image.$loki, () => {
        console.log(`Opened image ${file}`);
        next();
      })
    );
  },
  () =>
    console.log('Finished opening images')
  );
});

export default Galleries;
