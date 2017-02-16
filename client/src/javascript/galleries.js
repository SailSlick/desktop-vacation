import $ from 'jquery';
import Templates from './templates';
import DbConn from './db';
import Wallpaper from './wallpaper-client';

const gallery_db = new DbConn('galleries');
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
          name: name,
          tags: [],
          subgallaries: [],
          images: []
        };
        gallery_db.insert(doc, (inserted_gallery) => {
          console.log(`Added ${inserted_gallery.name}, id: ${inserted_gallery.$loki}`);
          gallery_db.findOne({ name: Galleries.baseName }, (base_gallery) => {
            if (base_gallery === null) {
              console.log(`${Galleries.baseName} not found.`);
              return;
            }
            base_gallery.subgallaries.push(inserted_gallery.$loki);
            console.log(base_gallery.subgallaries);
            console.log(base_gallery);
            gallery_db.updateOne(
              { name: Galleries.baseName },
              base_gallery, (updated) => {
                console.log(`Updated ${updated.name}, ${updated.subgallaries}`);
              }
            );
          });
        });
      } else {
        console.log(`Error adding ${name}, gallery already exists`);
      }

      gallery_db.save(() => {});
    });
  },

  addItem: (name, image_id) => {
    console.log(`Adding ${image_id} to gallery${name}`);
    gallery_db.findOne({ name }, (gallery) => {
      if (gallery === null) {
        console.log('Cannot find gallery');
        return;
      }
      gallery.images.push(image_id);
      gallery_db.updateOne({ name }, gallery, (updated) => {
        console.log(`Updated ${name}'s images to include ${updated.images}`);
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

  remove: (name) => {
    if (name !== 'all') delete gallery_db[name];
    Galleries.view();
  },

  removeItem: (name, path) => {
    if (name !== 'all') {
      gallery_db[name].splice(gallery_db[name].findIndex(v => v === path), 1);
    }
    Galleries.view();
  },

  pickGallery: (path) => {
    console.log(path);
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

  isGallery: gallery => gallery[0] !== '/', // XXX: change when real db is used

  view: (name) => {
    if (typeof name.type !== 'undefined' || name.length === 0) {
      name = 'Sully_all';
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
      $(`#gallery-col-${col} .img-card:last-child .btn-img-remove`).click(() => Images.removeItem(image, path));
      $(`#gallery-col-${col} .img-card:last-child .btn-img-setwp`).click(() => Wallpaper.set(path));
      $(`#gallery-col-${col} .img-card:last-child img`).click(() => Images.expand(path));
    });
  },

  setImageModule: (images_module) => { Images = images_module; }
};

export default Galleries;
