import $ from 'jquery';
import Templates from './templates';
import DbConn from './db';
import Wallpaper from './wallpaper-client';

let gallery_db;
let Images = null;
// let current_gallery = '';

const Galleries = {
  baseName: 'Sully'.concat('_all'),

  addGalleryName: () => {
    $('#hover-content').html(Templates.generate('gallery-get-name', {})).show();
    $('#hover-content form').submit((event) => {
      event.preventDefault();
      Galleries.add($('#gallery-name').val());
      $('#hover-content').html('').hide();
    });
    $('#hover-content .btn-danger').click(() => $('#hover-content').html('').hide());
  },

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
        gallery_db.insert(doc, (inserted_gallery) => {
          gallery_db.findOne({ name: Galleries.baseName }, (base_gallery) => {
            if (base_gallery === null) {
              console.error(`${Galleries.baseName} not found.`);
              return;
            }
            base_gallery.subgallaries.push(inserted_gallery.$loki);
            gallery_db.updateOne(
              { name: Galleries.baseName },
              base_gallery, () => { Galleries.view(); }
            );
          });
        });
      } else {
        console.log(`Error adding ${name}, gallery already exists`);
      }
    });
  },

  addItem: (name, image_id) => {
    console.log(`Adding image_id ${image_id} to gallery ${name}`);
    gallery_db.findOne({ name }, (gallery) => {
      if (gallery === null) {
        console.error('Cannot find gallery');
        return;
      }
      if ($.inArray(image_id, gallery.images) === -1) {
        gallery.images.push(image_id);
        gallery_db.updateOne({ name }, gallery, () => {});
      }
      // Silently ignore duplicate image
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
        return Images.image_db.findOne(
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
          Galleries.view();
        });
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
    $('#hover-content').html(Templates.generate('3-col-view', {
      title: 'Pick a gallery',
      hint: 'Click elsewhere to cancel'
    })).show();
    $('#hover-content .row').addClass('inverted centered padded');
    $('#hover-content').click(() =>
      $('#hover-content').html('').hide()
    );

    Galleries.forAllSubgalleries(Galleries.baseName, (subGallary, index) => {
      const col = index % 3;
      const selector = `#hover-content .view-col-${col}`;
      Galleries.getThumbnail(subGallary.name, (thumbnail) => {
        $(selector).append(Templates.generate('gallery-item', {
          name: subGallary.name,
          thumbnail
        }));
        $(`${selector} .gallery-card:last-child`).click(() => {
          Galleries.addItem(subGallary.name, path);
          $('#hover-content').html('').hide();
        });

        // Remove the ... menus
        $('#hover-content figcaption').remove();
      });
    });
  },

  forAllImages: (name, next) => {
    gallery_db.findOne({ name }, (gallery) => {
      gallery.images.forEach((id, index) => {
        Images.image_db.findOne({ $loki: id }, (image) => {
          if (image !== null) {
            next(image, index);
          } else {
            console.error(`${name} contains an invalid image: ${id}`);
          }
        });
      });
    });
  },

  view: (name) => {
    gallery_db.save(() => {});
    if (typeof name === 'undefined' || typeof name.type !== 'undefined' || name.length === 0) {
      name = Galleries.baseName;
    }
    $('#main-content').html(Templates.generate('3-col-view', {
      title: `Viewing gallery ${name}`,
      hint: 'Click to expand images'
    }));

    Galleries.forAllSubgalleries(name, (subGallary, index) => {
      const col = index % 3;
      const selector = `#main-content .view-col-${col}`;
      Galleries.getThumbnail(subGallary.name, (thumbnail) => {
        $(selector).append(Templates.generate('gallery-item', {
          name: subGallary.name,
          thumbnail
        }));
        $(selector).click(() => {
          Galleries.view(subGallary.name);
        });
        $(`${selector} .img-card:last-child .btn-gallery-remove`).click(() => Galleries.remove(subGallary.name));
      });
    });

    Galleries.forAllImages(name, (image, index) => {
      const col = index % 3;
      const path = image.location;
      const selector = `#main-content .view-col-${col}`;
      $(selector).append(Templates.generate('image-gallery-item', { src: path, id: index }));
      $(`${selector} .img-card:last-child .btn-img-remove`).click(() => Galleries.removeItem(name, image.$loki));
      $(`${selector} .img-card:last-child .btn-img-setwp`).click(() => Wallpaper.set(path));
      $(`${selector} .img-card:last-child .btn-img-addtogallery`).click(() => Galleries.pickGallery(image.$loki));
      $(`${selector} .img-card:last-child img`).click(() => Images.expand(path));
    });
  },

  setImageModule: (images_module) => { Images = images_module; }
};

// Events
$(document).on('vacation_loaded', () => {
  gallery_db = new DbConn('galleries');
});

export default Galleries;
