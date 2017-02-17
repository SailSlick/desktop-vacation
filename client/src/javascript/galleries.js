import $ from 'jquery';
import Templates from './templates';
import DbConn from './db';
import Wallpaper from './wallpaper-client';

let gallery_db;
let Images = null;
let current_gallery = '';

const Galleries = {
  baseName: 'Sully'.concat('_all'),

  addGalleryName: () => {
    $('#hover-content').html(Templates.generate('gallery-input', {})).show();
    $('#gallery-input-confirm').click(() => Galleries.add($('#gallery-input-box').val()));
    $('#quit-btn').click(() => $('#hover-content').html('').hide());
  },

  add: (name) => {
    $('#hover-content').html('').hide();
    console.log(`Adding gallery ${name}`);
    if (name.length === 0) {
      console.error('Zero length name');
      return;
    }
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
              base_gallery, () => { }
            );
          });
          if (current_gallery.length !== 0) {
            Galleries.addSubGallery(inserted_gallery, () => Galleries.view(current_gallery));
          } else {
            Galleries.view(current_gallery);
          }
        });
      } else if (current_gallery.length === 0) {
        console.error(`Error adding ${name}, gallery already exists`);
      } else {
        Galleries.addSubGallery(found_gallery, () => Galleries.view(current_gallery));
      }
    });
  },

  addSubGallery: (child_gallery, next) => {
    console.log(`Adding ${child_gallery.name} to ${current_gallery}`);
    if (current_gallery === Galleries.baseName) {
      console.error('Parent is baseName');
      return next();
    } else if (current_gallery === child_gallery.name) {
      console.error('Adding child gallery to itself');
      return next();
    }
    gallery_db.findOne({ name: current_gallery }, (parent_gallery) => {
      if (parent_gallery === null) {
        console.err(`${current_gallery} does not exist`);
      }
      if ($.inArray(child_gallery.$loki, parent_gallery.subgallaries) !== -1) {
        console.error(`${child_gallery.name} is already a subgallery`);
      }
      parent_gallery.subgallaries.push(child_gallery.$loki);
      gallery_db.updateOne({ name: current_gallery }, parent_gallery, next);
    });
    return next();
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
        gallery_db.findOne({ $loki: id }, (subGallery) => {
          if (subGallery !== null) {
            next(subGallery, index);
          } else {
            console.error(`Invalid subgallery in ${id}`);
          }
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
    $('#hover-content').html(Templates.generate('gallery-chooser', {})).show();
    $('#hover-content').click(() => {
      $('#hover-content').html('').hide();
      $('#hover-content').off('click');
    });

    Galleries.forAllSubgalleries(Galleries.baseName, (subGallery, index) => {
      const col = index % 3;
      $(`#gallery-pick-${col}`).append(Templates.generate('gallery-chooser-item', { name: subGallery.name }));
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
    } else {
      current_gallery = name;
    }
    $('#main-content').html(Templates.generate('image-gallery', {}));
    let col = 0;
    Galleries.forAllSubgalleries(name, (subGallery, index) => {
      col = index % 3;
      $(`#gallery-col-${col}`).append(Templates.generate('gallery-item', { name: subGallery.name }));
      $(`#gallery-col-${col} .img-card:last-child`).click(() => {
        Galleries.view(subGallery.name);
      });
      $(`#gallery-col-${col} .img-card:last-child .btn-img-remove`).click(() => Galleries.remove(subGallery.name));
    });
    const adj = col + 1; // this makes sure the next input doesn't stack

    Galleries.forAllImages(name, (image, index) => {
      col = (index + adj) % 3;
      const path = image.location;
      $(`#gallery-col-${col}`).append(Templates.generate('image-gallery-item', { src: path, id: index }));
      $(`#gallery-col-${col} .img-card:last-child .btn-img-remove`).click(() => Galleries.removeItem(name, image.$loki));
      $(`#gallery-col-${col} .img-card:last-child .btn-img-setwp`).click(() => Wallpaper.set(path));
      $(`#gallery-col-${col} .img-card:last-child .btn-img-addtogallery`).click(() => Galleries.pickGallery(image.$loki));
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
