import { map, each } from 'async';
import { ipcRenderer as ipc } from 'electron';
import DbConn from '../helpers/db';
import Images from './images';

let gallery_db;

const BASE_GALLERY_ID = 1;

const gallery_update_event = new Event('gallery_updated');

const Galleries = {
  should_save: true,

  add: (name, cb) => {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      console.error(`Invalid gallery name ${name}`);
      return cb(null);
    }
    console.log(`Adding gallery ${name}`);
    return gallery_db.findOne({ name }, (found_gallery) => {
      if (found_gallery) {
        console.error(`Gallery ${name} already exists`);
        return cb(found_gallery);
      }
      const doc = {
        name,
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

  addSubGallery(id, subgallery_id, cb) {
    if (id === subgallery_id) {
      console.error(`Tried to add gallery ${id} to itself`);
      return cb(null);
    }
    if (subgallery_id === BASE_GALLERY_ID) {
      console.error(`Tried to add base gallery to ${id}`);
      return cb(null);
    }
    return Galleries.get(id, (base_gallery) => {
      if (!base_gallery) {
        console.error(`No such gallery ${id}`);
        return cb(null);
      } else if (base_gallery.subgalleries.indexOf(subgallery_id) !== -1) {
        console.error(`Gallery ${subgallery_id} is already a subgallery of ${id}`);
        return cb(base_gallery);
      }
      base_gallery.subgalleries.push(subgallery_id);
      return gallery_db.updateOne(
        { $loki: id },
        { subgalleries: base_gallery.subgalleries },
        (updated_gallery) => {
          document.dispatchEvent(gallery_update_event);
          return cb(updated_gallery);
        }
      );
    });
  },

  addItem: (id, image_id, cb) => {
    console.log(`Adding image_id ${image_id} to gallery ${id}`);
    return Galleries.get(id, (gallery) => {
      if (gallery === null) {
        console.error('Cannot find gallery');
        return cb(null);
      } else if (gallery.images.indexOf(image_id) !== -1) {
        console.log('Tried to add duplicate image');
        return cb(gallery);
      }
      gallery.images.push(image_id);
      return gallery_db.updateOne({ $loki: id }, gallery, (new_gallery) => {
        // This may be changed later, because for every
        // image in a multi-add it will be fired... not
        // great for performance
        document.dispatchEvent(gallery_update_event);
        return cb(new_gallery);
      });
    });
  },

  get: (id, cb) =>
    gallery_db.findOne({ $loki: id }, cb),

  // Returns:
  //   - Subgalleries with thumbnail locations
  //   - Images with full details
  expand: (gallery, cb) => {
    // Expand Subgalleries
    map(gallery.subgalleries, (id, next) =>
      Galleries.get(id, (subgallery) => {
        // Get thumbnail
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
        (err_img, images) =>
          cb(subgalleries, images)
      )
    );
  },

  remove: (id, cb) => {
    console.log('Removing gallery:', id);
    if (id === BASE_GALLERY_ID) {
      const msg = 'Tried to delete base gallery';
      console.error(msg);
      return cb(msg);
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
          document.dispatchEvent(gallery_update_event);
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
        console.error(`${id} not found`);
        return cb(null);
      }
      gallery.images = gallery.images.filter(i => i !== item_id);
      return gallery_db.updateOne({ $loki: id }, gallery, (new_gallery) => {
        console.log('Item removed');
        document.dispatchEvent(gallery_update_event);
        return cb(new_gallery);
      });
    });
  },

  deleteItem: (id, cb) => {
    console.log(`Deleting ${id} from db and fs`);
    Images.delete(id, _ =>
      Galleries.removeItemGlobal(id, cb)
    );
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
          document.dispatchEvent(gallery_update_event);
          cb();
        })
      )
    );
  }
};

// Events
document.addEventListener('vacation_loaded', () => {
  gallery_db = new DbConn('galleries');
}, false);

document.addEventListener('gallery_updated', () =>
  Galleries.should_save && gallery_db.save(_ => console.log('Database saved')),
false);

// IPC Calls
ipc.on('selected-directory', (event, files) =>
  each(files, (file, next) =>
    Images.add(file, image =>
      Galleries.addItem(BASE_GALLERY_ID, image.$loki, () => {
        console.log(`Opened image ${file}`);
        next();
      })
    ),
  () =>
    console.log('Finished opening images')
  )
);

export default Galleries;
