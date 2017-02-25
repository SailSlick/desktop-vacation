import async from 'async';
import DbConn from '../helpers/db';
import image_db from './images';

let gallery_db;

const Galleries = {
  baseName: 'Sully'.concat('_all'),

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
          gallery_db.findOne({ name: Galleries.baseName }, (base_gallery) => {
            if (base_gallery === null) {
              const msg = `${Galleries.baseName} not found.`;
              console.error(msg);
              return msg;
            }
            base_gallery.subgallaries.push(inserted_gallery.$loki);
            gallery_db.updateOne(
              { name: Galleries.baseName },
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
        return 0;
      }
      const msg = 'Duplicate Image added';
      console.error(msg);
      return msg;
    });
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

  getThumbnail: (name, next) => {
    gallery_db.findOne({ name }, (gallery) => {
      if (gallery.images.length !== 0) {
        return image_db.findOne(
          { $loki: gallery.images[0] },
          image => next(image.location)
        );
      }
      return next();
    });
  },

  get: (id, cb) => {
    gallery_db.findOne({ $loki: id }, cb);
  },

  getByName: (name, cb) => {
    gallery_db.findOne({ name }, cb);
  },

  remove: (name) => {
    console.log(`Removing gallery: ${name}`);
    if (name !== Galleries.baseName) {
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
    if (name !== Galleries.baseName) {
      gallery_db.findOne({ name }, (gallery) => {
        if (gallery === null) {
          const msg = `${name} not found`;
          console.error(msg);
          return msg;
        }
        gallery.images = gallery.images.filter(i => i !== id);
        return gallery_db.updateOne({ name }, gallery);
      });
    }
  },

  getSubgalleries: (name, cb) => {
    gallery_db.findOne({ name: name || Galleries.baseName }, gallery =>
      async.map(gallery.subgalleries, (id, next) =>
        Galleries.get(id, (subgallery) => {
          // Get thumbnail
          if (subgallery.images.length !== 0) {
            image_db.findOne(
              { $loki: gallery.images[0] },
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

  forAllImages: (name, next) => {
    gallery_db.findOne({ name }, (gallery) => {
      gallery.images.forEach((id, index) => {
        image_db.findOne({ $loki: id }, (image) => {
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

export default Galleries;
