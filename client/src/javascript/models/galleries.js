import { map, each } from 'async';
import { ipcRenderer as ipc } from 'electron';
import DbConn from '../helpers/db';
import Images from './images';

let gallery_db;

const BASE_GALLERY_ID = 1;

const gallery_update_event = new Event('gallery_updated');

const Galleries = {
  add: (name, cb) => {
    console.log(`Adding gallery ${name}`);
    gallery_db.findOne({ name }, (found_gallery) => {
      if (found_gallery) {
        console.log(`Gallery ${name} already exists`);
        return cb(found_gallery);
      }
      const doc = {
        name,
        tags: [],
        subgalleries: [],
        images: []
      };
      return gallery_db.insert(doc, (inserted_gallery) => {
        gallery_db.findOne({ $loki: BASE_GALLERY_ID }, (base_gallery) => {
          base_gallery.subgalleries.push(inserted_gallery.$loki);
          return gallery_db.updateOne(
            { name: BASE_GALLERY_ID },
            base_gallery,
            () => {
              document.dispatchEvent(gallery_update_event);
              cb(inserted_gallery);
            }
          );
        });
      });
    });
  },

  addItem: (id, image_id, cb) => {
    console.log(`Adding image_id ${image_id} to gallery ${id}`);
    return gallery_db.findOne({ $loki: id }, (gallery) => {
      if (gallery === null) {
        const msg = 'Cannot find gallery';
        console.error(msg);
        return cb(null);
      } else if (gallery.images.indexOf(image_id) !== -1) {
        const msg = 'Duplicate Image added';
        console.log(msg);
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

  remove: (id) => {
    console.log(`Removing gallery: ${id}`);
    if (id === BASE_GALLERY_ID) {
      const msg = 'Tried to delete base gallery';
      console.log(msg);
      return msg;
    }

    // db.js does the existence check
    gallery_db.removeOne({ $loki: id });

    return gallery_db.findMany({ subgalleries: { $contains: id } }, references =>
      each(references, (ref, next) => {
        ref.subgalleries = ref.subgalleries.filter(i => i !== id);
        gallery_db.updateOne(
          { $loki: ref.$loki },
          ref.subgalleries,
          () => {
            console.log(`- ${ref.$loki} no longer contains reference to gallery`);
            next();
          }
        );
      }, () =>
        document.dispatchEvent(gallery_update_event)
      )
    );
  },

  removeItem: (id, item_id, cb) => {
    console.log(`Attempting to remove ${item_id} from ${id}`);
    gallery_db.findOne({ $loki: id }, (gallery) => {
      if (gallery === null) {
        console.error(`${id} not found`);
        return cb(null);
      }
      gallery.images = gallery.images.filter(i => i !== item_id);
      if (id === BASE_GALLERY_ID) {
        console.log('TODO delete from all galleries if removed from base gallery');
      }
      return gallery_db.updateOne({ $loki: id }, gallery, (new_gallery) => {
        console.log('Item removed');
        document.dispatchEvent(gallery_update_event);
        return cb(new_gallery);
      });
    });
  }
};

// Events
document.addEventListener('vacation_loaded', () => {
  gallery_db = new DbConn('galleries');
}, false);

document.addEventListener('gallery_updated', () => {
  gallery_db.save(_ => console.log('Database saved'));
}, false);

// IPC Calls
ipc.on('selected-directory', (event, files) => {
  let i;
  for (i = 0; i < files.length; i++) {
    Images.add(files[i], image =>
      Galleries.addItem(BASE_GALLERY_ID, image.$loki)
    );
    console.log(`Opened image ${files[i]}`);
  }
});

export default Galleries;
