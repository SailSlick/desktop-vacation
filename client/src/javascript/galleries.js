import $ from 'jquery';
import Templates from './templates';
// import Images from './images';
import Wallpaper from './wallpaper-client';

const gallery_db = { };
let current_gallery = '';

const Galleries = {
  addGalleryName: () => {
    $('#hover-content').html(Templates.generate('gallery-input', {})).show();
    $('#gallery-input-confirm').click(() => Galleries.add($('#gallery-input-box').val()));
    $('#quit-btn').click(() => $('#hover-content').html('').hide());
  },

  add: (name) => {
    $('#hover-content').html('').hide();

    if (current_gallery.length === 0) {
      if (name in gallery_db) {
        console.log('show an error dude');
        return;
      }
      gallery_db[name] = [];
    } else {
      if (!(name in gallery_db)) {
        gallery_db[name] = [];
      }
      gallery_db[current_gallery].push(name);
    }

    console.log(`Added ${name}`);
    Galleries.view();
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

  view: (gallery) => {
    let items = [];
    if (typeof gallery === 'undefined' || typeof gallery_db[gallery] === 'undefined') {
      for (const name in gallery_db) {
        items.push(name);
        current_gallery = '';
      }
    } else {
      items = gallery_db[gallery];
    }
    $('#main-content').html(Templates.generate('image-gallery', {}));
    // XXX below method is not allowed in linter however, keys is missing from
    // an object, so this is the way I'll do it atm
    items.forEach((path, index) => {
      const col = index % 3;
      if (Galleries.isGallery(path)) {
        $(`#gallery-col-${col}`).append(Templates.generate('gallery-item', { name: path }));
        $(`#gallery-col-${col}`).click(() => {
          Galleries.view(path);
          current_gallery = path;
        });
        $(`#gallery-col-${col} .img-card:last-child .btn-img-remove`).click(() => Galleries.remove(path));
      } else {
        // The item is an image, render it as such
        $(`#gallery-col-${col}`).append(Templates.generate('image-gallery-item', { src: path, id: index }));
        // XXX Apparently you can't modules import recursivly..?
        // $(`#gallery-col-${col} .img-card:last-child img`).click(() => Images.expand(path));
        $(`#gallery-col-${col} .img-card:last-child .btn-img-remove`).click(() => Galleries.removeItem(gallery, path));
        $(`#gallery-col-${col} .img-card:last-child .btn-img-setwp`).click(() => Wallpaper.set(path));
      }
    });
  },
};

export default Galleries;
