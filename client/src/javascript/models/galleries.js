import async from 'async';
import { ipcRenderer as ipc } from 'electron';
import DbConn from '../helpers/db';
import Images from './images';

let gallery_db;

const BASE_GALLERY = 'Sully_all';

const gallery_update_event = new Event('gallery_updated');

const Galleries = {
  add: (name) => {
    console.log(`Adding gallery ${name}`);
    gallery_db.findOne({ name }, (found_gallery) => {
      if (found_gallery === null) {
        const doc = {
          name,
          tags: [],
          subgallaries: [],
          images: []
        };
        return gallery_db.insert(doc, (inserted_gallery) => {
          gallery_db.findOne({ name: BASE_GALLERY }, (base_gallery) => {
            if (base_gallery === null) {
              const msg = `${BASE_GALLERY} not found.`;
              console.error(msg);
              return msg;
            }
            base_gallery.subgallaries.push(inserted_gallery.$loki);
            gallery_db.updateOne(
              { name: BASE_GALLERY },
              base_gallery
            );
            return 0;
          });
        });
      }
      const msg = `Error adding ${name}, gallery already exists`;
      console.error(msg);
      return msg;
    });
  },

  addItem: (name, image_id) => {
    console.log(`Adding image_id ${image_id} to gallery ${name}`);
    return gallery_db.findOne({ name }, (gallery) => {
      if (gallery === null) {
        const msg = 'Cannot find gallery';
        console.error(msg);
        return msg;
      }
      if (gallery.images.indexOf(image_id) === -1) {
        gallery.images.push(image_id);
        gallery_db.updateOne({ name }, gallery, () => {});

        // This may be changed later, because for every
        // image in a multi-add it will be fired... not
        // great for performance
        document.dispatchEvent(gallery_update_event);
        return 0;
      }
      const msg = 'Duplicate Image added';
      console.error(msg);
      return msg;
    });
  },

  get: (id, cb) => {
    gallery_db.findOne({ $loki: id }, cb);
  },

  getByName: (name, cb) => {
    gallery_db.findOne({ name }, cb);
  },

  getThumbnail: (name, next) => {
    gallery_db.findOne({ name }, (gallery) => {
      if (gallery.images.length !== 0) {
        return Images.get(
          gallery.images[0],
          image => next(image.location)
        );
      }
      return next();
    });
  },

  getSubgalleries: (name, cb) => {
    gallery_db.findOne({ name: name || BASE_GALLERY }, gallery =>
      async.map(gallery.subgalleries, (id, next) =>
        Galleries.get(id, (subgallery) => {
          // Get thumbnail
          if (subgallery.images.length !== 0) {
            Images.get(
              gallery.images[0],
              (image) => {
                subgallery.thumbnail = image.location;
                next(null, subgallery);
              }
            );
          } else {
            next(null, subgallery);
          }
        }),
      (_, subgalleries) =>
        cb(subgalleries)
      )
    );
  },

  remove: (name) => {
    console.log(`Removing gallery: ${name}`);
    if (name !== BASE_GALLERY) {
      return gallery_db.findOne({ name }, (gallery) => {
        if (gallery == null) {
          const msg = 'No gallery to delete';
          console.error(msg);
          return msg;
        }
        gallery_db.findMany({ subgallaries: { $contains: gallery.$loki } }, (references) => {
          references.forEach((ref, _i) => {
            ref.subgallaries = ref.subgallaries.filter(i => i !== gallery.$loki);
            gallery_db.updateOne(
              { $loki: ref.$loki },
              ref.subgallaries,
              r => console.log(`- ${r.name} no longer contains reference to gallery`));
          });
        });
        return gallery_db.removeOne({ name });
      });
    }
    const msg = 'Tried to delete base gallery';
    console.error(msg);
    return msg;
  },

  removeItem: (name, id) => {
    console.log(`Attempting to remove ${id} from ${name}`);
    gallery_db.findOne({ name }, (gallery) => {
      if (gallery === null) {
        const msg = `${name} not found`;
        console.error(msg);
      } else {
        gallery.images = gallery.images.filter(i => i !== id);
        gallery_db.updateOne({ name }, gallery, () => {
          console.log('Item removed');
          document.dispatchEvent(gallery_update_event);
        });
      }
    });
    if (name === BASE_GALLERY) {
      console.log('TODO delete from image db');
    }
  },

  forAllSubgalleries: (name, next) => {
    gallery_db.findOne({ name }, (gallery) => {
      if (gallery === null) {
        console.error(`${name} is an invalid gallery`);
        return;
      }
      gallery.subgallaries.forEach((id, index) => {
        gallery_db.findOne({ $loki: id }, (subGallary) => {
          if (subGallary !== null) {
            next(subGallary, index);
          } else {
            console.error(`Invalid subgallary in ${id}`);
          }
        });
      });
    });
  },

  forAllImages: (name, next) => {
    gallery_db.findOne({ name }, (gallery) => {
      gallery.images.forEach((id, index) => {
        Images.get(id, (image) => {
          if (image !== null) {
            next(image, index);
          } else {
            console.error(`${name} contains an invalid image: ${id}`);
          }
        });
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
      Galleries.addItem(BASE_GALLERY, image.$loki)
    );
    console.log(`Opened image ${files[i]}`);
  }
});

export default Galleries;
