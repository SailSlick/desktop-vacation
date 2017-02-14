import $ from 'jquery';
import { ipcRenderer as ipc } from 'electron';
import Templates from './templates';
import DbConn from './db';
import Wallpaper from './wallpaper-client';

//const DbConn = require('./db');

const image_db = new DbConn('images');

// Exported methods
const Images = {

  getAll: () => image_db.findMany({ location: { $gte: 0 } }, cb => cb),

  getNew: () => {
    ipc.send('open-file-dialog');
  },

  add: (path) => {
    const doc = {
      hash: '',
      metadata: { rating: 0, tags: [] },
      location: path
    };
    image_db.insert(doc, () => {});
  },

  remove: (path) => {
    image_db.removeOne({ location: path });
    console.log(`Removed image ${path}`);
    // Redraw
    Images.view();
  },

  view: () => {
    // Replace the main content
    $('#main-content').html(Templates.generate('image-gallery', {}));

    image_db.findMany({ location: { $gte: 0 } }, (cb) => {
      for (const index in cb) {
        const path = cb.location;
        console.error(index, path);
        const col = index % 3;
        $(`#gallery-col-${col}`).append(Templates.generate('image-gallery-item', { src: path, id: index }));
        $(`#gallery-col-${col} .img-card:last-child img`).click(() => Images.expand(path));
        $(`#gallery-col-${col} .img-card:last-child .btn-img-remove`).click(() => Images.remove(path));
        $(`#gallery-col-${col} .img-card:last-child .btn-img-setwp`).click(() => Wallpaper.set(path));
      }
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
