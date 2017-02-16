import $ from 'jquery';
import { ipcRenderer as ipc } from 'electron';
import Templates from './templates';
import DbConn from './db';
import Wallpaper from './wallpaper-client';
import Galleries from './galleries';

let image_db;

// Exported methods
const Images = {

  getAll: (cb) => {
    image_db.findMany({ location: { $gte: '' } }, (doc_array) => {
      cb(doc_array);
    });
  },

  getNew: () => {
    ipc.send('open-file-dialog');
  },

  add: (path) => {
    const doc = {
      hash: '',
      metadata: { rating: 0, tags: [] },
      location: path
    };
    const query = { location: path };
    image_db.findOne(query, (ex_doc) => {
      if (ex_doc === null) {
        image_db.insert(doc, () => {});
      }
    });
  },

  remove: (path) => {
    image_db.removeOne({ location: path });
    console.log(`Removed image ${path}`);
    // Redraw
    Images.view();
  },

  view: () => {
    // Replace the main content
    $('#main-content').html(Templates.generate('3-col-view', {
      title: 'Viewing all images',
      hint: 'Click to expand images'
    }));
    image_db.findMany({ location: { $gte: '' } }, (data) => {
      data.forEach((obj, index) => {
        const path = obj.location;
        const col = index % 3;
        const selector = `#main-content .view-col-${col}`;
        $(selector).append(Templates.generate('image-gallery-item', { src: path, id: index }));
        $(`${selector} .img-card:last-child img`).click(() => Images.expand(path));
        $(`${selector} .img-card:last-child .btn-img-remove`).click(() => Images.remove(path));
        $(`${selector} .img-card:last-child .btn-img-setwp`).click(() => Wallpaper.set(path));
        $(`${selector} .img-card:last-child .btn-img-addtogallery`).click(() => Galleries.pickGallery(obj.$loki));
      });
    });
    image_db.save(() => {});
  },

  expand: (path) => {
    $('#hover-content').html(Templates.generate('image-expanded', { src: path })).show();
    $('#hover-content>*').click(Images.collapse);
  },

  collapse: () => {
    $('#hover-content').html('').hide();
  },
};

// Events
$(document).on('vacation_loaded', () => {
  image_db = new DbConn('images');
  Images.image_db = image_db;
  Images.view();
});

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

/* XXX This is a workaround for a bug Lucas and I couldn't find another way
 * around. Two modules can't import each other at the moment.
 * They're bundled up, and one of them is guaranteed to come before another.
 * Hoping to fix soon. */
Galleries.setImageModule(Images);
