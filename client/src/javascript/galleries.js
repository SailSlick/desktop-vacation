import $ from 'jquery';
import Templates from './templates';
import DbConn from './db';
import Wallpaper from './wallpaper-client';

let gallery_db;
let Images = null;
// let current_gallery = '';

const Galleries = {
  baseName: 'Sully_all',

  addGalleryName: () => {
    $('#hover-content').html(Templates.generate('gallery-input', {})).show();
    $('#gallery-input-confirm').click(() => Galleries.add($('#gallery-input-box').val()));
    $('#quit-btn').click(() => $('#hover-content').html('').hide());
  },

  add: (name) => {
    $('#hover-content').html('').hide();

    gallery_db.findOne({ name }, (found_gallery) => {
      if (found_gallery === null) {
        const doc = {
          name,
          tags: [],
          subgallaries: [],
          images: []
        };
        gallery_db.insert(doc, (inserted_gallery) => {
          gallery_db.findOne({ name: Galleries.baseName }, (base_gallery) => {
            if (base_gallery === null) {
              console.error(`${Galleries.baseName} not found.`);
              return;
            }
            base_gallery.subgallaries.push(inserted_gallery.$loki);
            console.log(base_gallery.subgallaries);
            console.log(base_gallery);
            gallery_db.updateOne(
              { name: Galleries.baseName },
              base_gallery, (updated) => {
                console.log(`Updated ${updated.name}, [${updated.subgallaries}]`);
                Galleries.view();
              }
            );
          });
        });
      } else {
        console.log(`Error adding ${name}, gallery already exists`);
      }
    });
  },

  addItem: (name, image_id) => {
    console.log(`Adding ${image_id} to gallery${name}`);
    gallery_db.findOne({ name }, (gallery) => {
      if (gallery === null) {
        console.error('Cannot find gallery');
        return;
      }
      gallery.images.push(image_id);
      gallery_db.updateOne({ name }, gallery, () => {
        Galleries.view();
      });
    });
  },

  forAllSubgalleries: (name, next) => {
    gallery_db.findOne({ name }, (gallery) => {
      gallery.subgallaries.forEach((id, index) => {
        gallery_db.findOne({ $loki: id }, (subGallary) => {
          next(subGallary, index);
        });
      });
    });
  },

  getThumbnail: (name, next) => {
    gallery_db.findOne({ name }, (gallery) => {
      if (gallery.images !== 0) {
        Images.image_db.findOne(
          { $loki: gallery.images[0] },
          image => next(image.location)
        );
      }
      return next();
    });
  },

  remove: (name) => {
    console.log(`Removing gallery: ${name}`);
    if (name !== Galleries.baseName) {
      gallery_db.findOne({ name }, (gallery) => {
        if (gallery == null) {
          console.error('No gallery to delete');
          return;
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
        Galleries.view();
        gallery_db.removeOne({ name });
      });
    } else {
      console.error('Tried to delete base gallery');
    }
  },

  removeItem: (name, id) => {
    console.log(`Attempting to remove ${id} from ${name}`);
    if (name !== Galleries.baseName) {
      gallery_db.findOne({ name }, (gallery) => {
        if (gallery === null) {
          console.error(`${name} not found`);
          Galleries.view();
          return;
        }
        gallery.images = gallery.images.filter(i => i !== id);
        gallery_db.updateOne({ name }, gallery, () => {
          Galleries.view();
        });
      });
    }
  },

  pickGallery: (path) => {
    $('#hover-content').html(Templates.generate('gallery-chooser', {})).show();
    $('#hover-content').click(() => {
      $('#hover-content').html('').hide();
      $('#hover-content').off('click');
    });

    Galleries.forAllSubgalleries(Galleries.baseName, (subGallary, index) => {
      const col = index % 3;
      $(`#gallery-pick-${col}`).append(Templates.generate('gallery-chooser-item', { name: subGallary.name }));
      $(`#gallery-pick-${col} .gallery-chooser-item:last-child`).click((ev) => {
        Galleries.addItem($(ev.currentTarget).text(), path);
        $('#hover-content').html('').hide();
        $('#hover-content').off('click');
      });
    });
  },

  forAllImages: (name, next) => {
    gallery_db.findOne({ name }, (gallery) => {
      gallery.images.forEach((id, index) => {
        Images.image_db.findOne({ $loki: id }, (image) => {
          next(image, index);
        });
      });
    });
  },

  view: (name) => {
    gallery_db.save(() => {});
    if (typeof name === 'undefined' || typeof name.type !== 'undefined' || name.length === 0) {
      name = Galleries.baseName;
    }
    $('#main-content').html(Templates.generate('image-gallery', {}));

    Galleries.forAllSubgalleries(name, (subGallary, index) => {
      const col = index % 3;
      $(`#gallery-col-${col}`).append(Templates.generate('gallery-item', { name: subGallary.name }));
      $(`#gallery-col-${col}`).click(() => {
        Galleries.view(subGallary.name);
      });
      $(`#gallery-col-${col} .img-card:last-child .btn-img-remove`).click(() => Galleries.remove(subGallary.name));
    });

    Galleries.forAllImages(name, (image, index) => {
      const col = index % 3;
      const path = image.location;
      $(`#gallery-col-${col}`).append(Templates.generate('image-gallery-item', { src: path, id: index }));
      $(`#gallery-col-${col} .img-card:last-child .btn-img-remove`).click(() => Galleries.removeItem(name, image.$loki));
      $(`#gallery-col-${col} .img-card:last-child .btn-img-setwp`).click(() => Wallpaper.set(path));
      $(`#gallery-col-${col} .img-card:last-child img`).click(() => Images.expand(path));
    });
  },

  setImageModule: (images_module) => { Images = images_module; }
};

// Events
$(document).on('vacation_loaded', () => {
  gallery_db = new DbConn('galleries');
});

export default Galleries;
