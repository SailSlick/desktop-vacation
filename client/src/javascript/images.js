import $ from 'jquery';
import { ipcRenderer as ipc } from 'electron';
import Templates from './templates';
import DbConn from './db';
import Wallpaper from './wallpaper-client';
import Galleries from './galleries';

const image_db = new DbConn('images');

// Exported methods
const Images = {

  firstLoad: () => {
    image_db.onLoad = Images.view;
  },

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
    $('#main-content').html(Templates.generate('image-gallery', {}));
    image_db.findMany({ location: { $gte: '' } }, (data) => {
      console.log(data);
      data.forEach((obj, index) => {
        const path = obj.location;
        const col = index % 3;
        $(`#gallery-col-${col}`).append(Templates.generate('image-gallery-item', {
          src: path,
          id: index,
          addgallery: true
        }));
        $(`#gallery-col-${col} .img-card:last-child img`).click(() => Images.expand(path));
        $(`#gallery-col-${col} .img-card:last-child .btn-img-remove`).click(() => Images.remove(path));
        $(`#gallery-col-${col} .img-card:last-child .btn-img-setwp`).click(() => Wallpaper.set(path));
        $(`#gallery-col-${col} .img-card:last-child .btn-img-addtogallery`).click(() => Galleries.pickGallery(path));
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
$(document).on('templates_loaded', Images.firstLoad);

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
Galleries.setImageModule(Images); // XXX: Hacky
