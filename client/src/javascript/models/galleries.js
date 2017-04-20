import { map, each, eachOf, filter as asyncFilter } from 'async';
import { ipcRenderer as ipc } from 'electron';
import { basename } from 'path';
import DbConn from '../helpers/db';
import Images from './images';
import { updateProgressBar, endProgressBar } from '../helpers/progress';
import { success, warning } from '../helpers/notifier';
import Sync from '../helpers/sync';

let gallery_db;

const gallery_update_event = new Event('gallery_updated');

const Galleries = {
  should_save: true,
  gallery_update_event,
  BASE_GALLERY_ID: -1,

  downloadRoot: (remoteId, cb) =>
    Sync.downloadGallery(remoteId, (err, gallery) => {
      if (err) return cb(err);
      return gallery_db.insert(gallery, (root_gallery) => {
        Galleries.BASE_GALLERY_ID = root_gallery.$loki;
        cb(null, root_gallery.$loki);
      });
    }, true),

  syncRoot: cb =>
    Sync.uploadGallery(Galleries.BASE_GALLERY_ID, cb),

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
      return Galleries.insert(doc, cb);
    });
  },

  insert: (gallery, cb) => {
    gallery_db.insert(gallery, (inserted_gallery) => {
      // addSubgallery will dispatch the event
      const id = inserted_gallery.$loki;
      Galleries.addSubGallery(Galleries.BASE_GALLERY_ID, id, () =>
        cb(inserted_gallery)
      );
    });
  },

  convertToGroup: (id, remoteId, cb) => {
    gallery_db.updateOne({ $loki: id }, {
      group: true,
      remoteId
    }, (ret) => {
      if (Galleries.should_save) document.dispatchEvent(gallery_update_event);
      cb(ret);
    });
  },

  addSubGallery: (id, subgallery_id, cb) => {
    if (id === subgallery_id) {
      return cb(null, `Tried to add gallery ${id} to itself`);
    }
    if (subgallery_id === Galleries.BASE_GALLERY_ID) {
      return cb(null, `Tried to add base gallery to ${id}`);
    }
    if (Galleries.BASE_GALLERY_ID === -1) {
      return cb(null, 'Base gallery not defined');
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

  getMongo: (id, cb) => gallery_db.findOne({ remoteId: id }, cb),

  getName: (name, cb) => gallery_db.findOne({ name }, cb),

  getMany: (ids, cb) => gallery_db.findMany({ $loki: { $in: ids } }, cb),

  getManyRemote: (remoteIds, cb) => gallery_db.findMany({ remoteId: { $in: remoteIds } }, cb),

  filterSingle: (item, filter, cb) => {
    let filterThrough = true;
    if (filter.name) {
      filter.name = filter.name.toLowerCase();
      if (item.name) {
        filterThrough = filterThrough && item.name.toLowerCase().indexOf(filter.name) !== -1;
      } else if (item.location) {
        filterThrough = filterThrough && item.location.toLowerCase().indexOf(filter.name) !== -1;
      }
    }
    if (filter.tags) {
      filterThrough = filterThrough &&
        filter.tags.filter((tag) => {
          if (tag.length === 0) {
            return true;
          }
          return item.metadata.tags.indexOf(tag.toLowerCase().trim()) !== -1;
        }).length === filter.tags.length;
    }
    if (filter.rating && filter.rating !== 0) {
      filterThrough = filterThrough && item.metadata.rating === filter.rating;
    }
    return cb(null, filterThrough);
  },

  filter: (subgalleries, images, filter, cb) => {
    if (filter) {
      asyncFilter(
        subgalleries,
        (x, next) => Galleries.filterSingle(x, filter, next),
        (_, filteredGalleries) => {
          asyncFilter(
            images,
            (x, next) => Galleries.filterSingle(x, filter, next),
            (__, filteredImages) => {
              cb(filteredGalleries, filteredImages);
            }
          );
        }
      );
    } else {
      cb(subgalleries, images);
    }
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
    if (id === Galleries.BASE_GALLERY_ID) {
      return cb('Tried to delete base gallery');
    }

    return gallery_db.findMany({ subgalleries: { $contains: id } }, references =>
      each(references, (ref, next) => {
        ref.subgalleries = ref.subgalleries.filter(i => i !== id);
        Galleries.appendRemoveList(ref.$loki, id, true, () =>
          gallery_db.updateOne(
            { $loki: ref.$loki },
            ref.subgalleries,
            () => {
              console.log(`- ${ref.$loki} no longer contains reference to ${id}`);
              next();
            }
          )
        );
      }, () =>
        Sync.unsyncGallery(id, (err) => {
          if (err) return cb(err);
          return gallery_db.removeOne({ $loki: id }, () => {
            if (Galleries.should_save) document.dispatchEvent(gallery_update_event);
            cb();
          });
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

  update: (id, data, cb) => {
    gallery_db.updateOne({ $loki: id }, data, (doc) => {
      if (doc && Galleries.should_save) {
        document.dispatchEvent(gallery_update_event);
      }
      return cb(doc);
    });
  },

  removeItem: (id, item_id, cb) => {
    console.log(`Attempting to remove ${item_id} from ${id}`);
    if (id === Galleries.BASE_GALLERY_ID) {
      return Galleries.removeItemGlobal(item_id, cb);
    }
    return Galleries.get(id, (gallery) => {
      if (gallery === null) {
        return cb(null, `${id} not found`);
      }
      gallery.images = gallery.images.filter(i => i !== item_id);
      return Galleries.appendRemoveList(id, item_id, false, () =>
        Images.get(item_id, (image) => {
          if (image && image.remoteId) {
            gallery.removed = gallery.removed || [];
            gallery.removed.push(image.remoteId);
          }
          gallery_db.updateOne({ $loki: id }, gallery, (new_gallery) => {
            console.log('Item removed');
            if (Galleries.should_save) document.dispatchEvent(gallery_update_event);
            cb(new_gallery);
          });
        })
      );
    });
  },

  deleteItem: (id, cb) => {
    console.log(`Deleting ${id} from db and fs`);
    Images.delete(id, (err_msg) => {
      if (err_msg) return cb(err_msg);
      return Galleries.removeItemGlobal(id, cb);
    });
  },

  deleteGroupItem: (gid, id, cb) => {
    console.log(`Deleting ${id} from group, db and fs`);
    Galleries.removeItem(gid, id, (failure, errMsg) => {
      if (failure) cb(errMsg);
      else {
        Images.delete(id, (delErrMsg) => {
          if (delErrMsg) return cb(delErrMsg);
          return Images.removeClient(id, cb);
        });
      }
    });
  },

  // Removes an image from all the galleries it was in
  removeItemGlobal: (id, cb) => {
    console.log('Globally removing image:', id);
    gallery_db.findMany({ images: { $contains: id } }, refs =>
      each(refs, (gallery, next) => {
        gallery.images = gallery.images.filter(i => i !== id);
        Galleries.appendRemoveList(gallery.$loki, id, false, () =>
          gallery_db.updateOne({ $loki: gallery.$loki }, gallery, () => {
            console.log(`- ${gallery.$loki} no longer contains reference to ${id}`);
            next();
          })
        );
      }, () =>
        Images.remove(id, () => {
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

  setBaseId: (id) => {
    Galleries.BASE_GALLERY_ID = id;
  },

  appendRemoveListInternal: (gid, remoteId, cb) => {
    if (!remoteId) return cb();
    return Galleries.get(gid, (gallery) => {
      gallery.removed = gallery.removed || [];
      gallery.removed.push(remoteId);
      Galleries.update(gid, { removed: gallery.removed }, cb);
    });
  },

  appendRemoveList: (gid, id, isGallery, cb) => {
    if (isGallery) {
      Galleries.get(id, gallery =>
        Galleries.appendRemoveListInternal(gid, gallery.remoteId, cb)
      );
    } else {
      Images.get(id, image =>
        Galleries.appendRemoveListInternal(gid, image.remoteId, cb)
      );
    }
  }
};

// Events
document.addEventListener('vacation_loaded', () => {
  gallery_db = new DbConn('galleries');
}, false);

document.addEventListener('gallery_updated', () =>
  gallery_db.save(_ => console.log('Database saved')),
false);

document.addEventListener('sync_root', () => Galleries.syncRoot(() => {}), false);

// IPC Calls
ipc.on('selected-directory', (event, files) => {
  Galleries.should_save = false;
  let dups = 0;
  eachOf(files, (file, index, next) => {
    Images.add(file, (image, dup) => {
      if (dup) dups += 1;
      else updateProgressBar(files.length - dups, `Adding ${basename(image.location)}`);
      Galleries.addItem(Galleries.BASE_GALLERY_ID, image.$loki, () => {
        console.log(`Opened image ${file}`);
        next();
      });
    });
  },
  () => {
    Galleries.should_save = true;
    document.dispatchEvent(gallery_update_event);
    endProgressBar();
    success(`Added ${files.length - dups} images`);
    if (dups > 0) warning(`${dups} duplicated images in add`);
    console.log('Finished opening images');
  });
});

export default Galleries;
