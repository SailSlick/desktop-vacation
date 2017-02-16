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
                gallery_db.save(() => {});
              }
            );
          });
        });
      } else {
        console.log(`Error adding ${name}, gallery already exists`);
      }

    });
  },

  addItem: (name, path) => {
    gallery_db[name].push(path);
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
    $('#hover-content').html(Templates.generate('gallery-chooser', {})).show();
    $('#hover-content').click(() => {
      $('#hover-content').html('').hide();
      $('#hover-content').off('click');
    });

    let i = 0;
    for (const name in gallery_db) {
      const col = i % 3;
      $(`#gallery-pick-${col}`).append(Templates.generate('gallery-chooser-item', { name }));
      $(`#gallery-pick-${col} .gallery-chooser-item:last-child`).click((ev) => {
        Galleries.addItem($(ev.currentTarget).text(), path);
        $('#hover-content').html('').hide();
        $('#hover-content').off('click');
      });
      i++;
    }
  },

  isGallery: gallery => gallery[0] !== '/', // XXX: change when real db is used

  view: (name) => {
    Galleries.getByName(name, 'Sully', (gallery) => {
      $('#main-content').html(Templates.generate('image-gallery', {}));
      // Populate subgallaries first
      gallery.subgallaries.forEach((id, index) => {
        const col = index % 3;
        $(`#gallery-col-${col}`).append(Templates.generate('gallery-item', { name: id }));
        $(`#gallery-col-${col}`).click(() => {
          Galleries.view(id);
          // current_gallery = id;
        });
        $(`#gallery-col-${col} .img-card:last-child .btn-img-remove`).click(() => Galleries.remove(id));
      });
      // Populate images now
      gallery.images.forEach((id, index) => {
        const col = index % 3;
        if (Images !== null) {
          Images.image_db.findOne({ $loki: id }, (image) => {
            const path = image.location;
            $(`#gallery-col-${col}`).append(Templates.generate('image-gallery-item', { src: path, id: index }));
            $(`#gallery-col-${col} .img-card:last-child .btn-img-remove`).click(() => Galleries.removeItem(gallery, path));
            $(`#gallery-col-${col} .img-card:last-child .btn-img-setwp`).click(() => Wallpaper.set(path));
            $(`#gallery-col-${col} .img-card:last-child img`).click(() => Images.expand(path));
          });
        }
      });
    });
  },

  setImageModule: (images_module) => { Images = images_module; }
};

// Events
$(document).on('vacation_loaded', () => {
  gallery_db = new DbConn('galleries');
});

export default Galleries;
