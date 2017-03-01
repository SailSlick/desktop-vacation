import async from 'async';
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
        gallery_db.findOne({ $loki: BASE_GALLERY_ID }, (base_gallery) => {
          if (base_gallery === null) {
            console.error(`${BASE_GALLERY_ID} not found.`);
            return cb(null);
          }
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

  addItem: (id, image_id) => {
    console.log(`Adding image_id ${image_id} to gallery ${id}`);
    return gallery_db.findOne({ $loki: id }, (gallery) => {
      if (gallery === null) {
        const msg = 'Cannot find gallery';
        console.error(msg);
        return msg;
      }
      if (gallery.images.indexOf(image_id) === -1) {
        gallery.images.push(image_id);
        gallery_db.updateOne({ $loki: id }, gallery, () =>
          // This may be changed later, because for every
          // image in a multi-add it will be fired... not
          // great for performance
          document.dispatchEvent(gallery_update_event)
        );
        return 0;
      }
      const msg = 'Duplicate Image added';
      console.error(msg);
      return msg;
    });
  },

  get: (id, cb) =>
    gallery_db.findOne({ $loki: id }, cb),

  // Returns:
  //   - Subgalleries with thumbnail locations
  //   - Images with full details
  expand: (gallery, cb) => {
    // Expand Subgalleries
    async.map(gallery.subgalleries, (id, next) =>
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
      async.map(gallery.images, (image_id, next) =>
          Images.get(image_id, image => next(null, image)),
        (err_img, images) =>
          cb(subgalleries, images)
      )
    );
  },

  remove: (id) => {
    console.log(`Removing gallery: ${id}`);
    if (id !== BASE_GALLERY_ID) {
      return gallery_db.findOne({ $loki: id }, (gallery) => {
        if (gallery == null) {
          const msg = 'No gallery to delete';
          console.error(msg);
          return msg;
        }
        gallery_db.findMany({ subgalleries: { $contains: gallery.$loki } }, (references) => {
          references.forEach((ref, _i) => {
            ref.subgalleries = ref.subgalleries.filter(i => i !== gallery.$loki);
            gallery_db.updateOne(
              { $loki: ref.$loki },
              ref.subgalleries,
              r => console.log(`- ${r.$loki} no longer contains reference to gallery`));
          });
        });
        gallery_db.removeOne({ $loki: id });
        return document.dispatchEvent(gallery_update_event);
      });
    }
    const msg = 'Tried to delete base gallery';
    console.error(msg);
    return msg;
  },

  removeItem: (id, item_id) => {
    console.log(`Attempting to remove ${item_id} from ${id}`);
    gallery_db.findOne({ $loki: id }, (gallery) => {
      if (gallery === null) {
        const msg = `${id} not found`;
        console.error(msg);
      } else {
        gallery.images = gallery.images.filter(i => i !== item_id);
        gallery_db.updateOne({ $loki: id }, gallery, () => {
          console.log('Item removed');
          document.dispatchEvent(gallery_update_event);
        });
        if (id === BASE_GALLERY_ID) {
          console.log('TODO delete from all galleries if removed from base gallery');
        }
      }
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
