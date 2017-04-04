import { map, each, eachOf } from 'async';
import { ipcRenderer as ipc } from 'electron';
import request from 'request';
import Host from './host';
import DbConn from '../helpers/db';
import Images from './images';
import { success, warning } from '../helpers/notifier';

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
        images: [],
        metadata: {
          rating: 0,
          tags: []
        }
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
        subgalleries: [],
        images: [],
        metadata: {
          rating: 0,
          tags: []
        }
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

  getName: (name, cb) => gallery_db.findOne({ name }, cb),

  filter: (subgalleries, images, filter, cb) => {
    if (filter) {
      if (filter.name) {
        filter.name = filter.name.toLowerCase();
        subgalleries = subgalleries.filter(x => x.name.toLowerCase().indexOf(filter.name) !== -1);
        images = images.filter(x => x.location.toLowerCase().indexOf(filter.name) !== -1);
      }
      if (filter.tag) {
        filter.tag = filter.tag.toLowerCase();
        subgalleries = subgalleries.filter(x =>
          x.metadata.tags.join().toLowerCase().indexOf(filter.tag) !== -1
        );
        images = images.filter(x =>
          x.metadata.tags.join().toLowerCase().indexOf(filter.tag) !== -1
        );
      }
      if (filter.rating && filter.rating !== 0) {
        subgalleries = subgalleries.filter(x => x.metadata.rating === filter.rating);
        images = images.filter(x => x.metadata.rating === filter.rating);
      }
    }
    cb(subgalleries, images);
  },

  // Returns:
  //   - Subgalleries with thumbnail locations
  //   - Images with full details
  expand: (gallery, filter, cb) => {
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
          Galleries.filter(subgalleries, images, filter, cb);
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

  updateMetadata: (id, metadata, cb) => {
    gallery_db.updateOne({ $loki: id }, { metadata }, (doc) => {
      if (doc && Galleries.should_save) {
        document.dispatchEvent(gallery_update_event);
      }
      return cb(doc);
    });
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
        return;
      }
      const options = {
        uri: Host.server_uri.concat(`/gallery/${userData.remoteGallery}`),
        jar: Host.cookie_jar,
        method: 'GET',
        json: true
      };
      request(options, (err, response, body) => {
        if (response.statusCode !== 200) {
          console.error(`Failure to sync, code: ${response.statusCode}`);
          console.error(body.error);
          return;
        } else if (!body.data.images || body.data.images.length === 0) {
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
  let dups = 0;
  eachOf(files, (file, index, next) => {
    if (index === files.length - 1) Galleries.should_save = true;
    Images.add(file, (image, dup) => {
      if (dup) dups += 1;
      Galleries.addItem(BASE_GALLERY_ID, image.$loki, () => {
        console.log(`Opened image ${file}`);
        next();
      });
    });
  },
  () => {
    success(`Added ${files.length - dups} images`);
    if (dups > 0) warning(`${dups} duplicated images`);
    console.log('Finished opening images');
  });
});

export default Galleries;
