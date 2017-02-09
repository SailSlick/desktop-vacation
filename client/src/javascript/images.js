import $ from 'jquery';
import { ipcRenderer as ipc } from 'electron';
import Templates from './templates';
import Wallpaper from './wallpaper-client';

const image_db = [];

// Exported methods
const Images = {

  getAll: () => image_db,

  getNew: () => {
    ipc.send('open-file-dialog');
  },

  add: (path) => {
    image_db.push(path);
  },

  remove: (path) => {
    image_db.splice(image_db.findIndex(val => val === path), 1);
    console.log(`Removed image ${path}`);

    // Redraw
    Images.view();
  },

  view: () => {
    // Replace the main content
    $('#main-content').html(Templates.generate('image-gallery', {}));

    image_db.forEach((path, index) => {
      const col = index % 3;
      $(`#gallery-col-${col}`).append(Templates.generate('image-gallery-item', { src: path, id: index }));
      $(`#gallery-col-${col} .img-card:last-child img`).click(() => Images.expand(path));
      $(`#gallery-col-${col} .img-card:last-child .btn-img-remove`).click(() => Images.remove(path));
      $(`#gallery-col-${col} .img-card:last-child .btn-img-setwp`).click(() => Wallpaper.set(path));
    });
  },

  expand: (path) => {
    $('#hover-content').html(Templates.generate('image-expanded', { src: path })).show();
    $('#hover-content>*').click(Images.collapse);
  },

  collapse: () => {
    $('#hover-content').html('').hide();
  }
};

// Events
$(document).on('templates_loaded', Images.view);

// IPC Calls
ipc.on('selected-directory', (event, files) => {
  let i;
  for (i = 0; i < files.length; i++) {
    Images.add(files[i]);
    console.log(`Opened image ${files[i]}`);
  }
  Images.view();
});

export default Images;
