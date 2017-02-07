import { ipcRenderer as ipc } from 'electron';
import Templates from './templates';
import $ from 'jquery';

let image_db = [];

// Exported methods
const Images = {

  getAll: _ => {
    return image_db;
  },

  getNew: _ => {
    ipc.send('open-file-dialog');
  },

  add: path => {
    image_db.push(path);
  },

  remove: path => {
    image_db.splice(image_db.findIndex(val => val == path), 1);
    console.log('Removed image ' + path);

    // Redraw
    Images.view();
  },

  view: _ => {

    // Replace the main content
    $('#main-content').html(Templates.generate('image-gallery', {}));

    image_db.forEach((path, index) => {
      $('#gallery-col-' + (index % 3)).append(Templates.generate('image-gallery-item', {src: path, id: index}));
      $('#gallery-col-' + (index % 3) + ' .img-card:last-child img').click(_ => Images.open(path));
      $('#gallery-col-' + (index % 3) + ' .img-card:last-child .btn-img-remove').click(_ => Images.remove(path));
    });
  },

  open: path => {
    $('#hover-content').html(Templates.generate('image-expanded', {src: path})).show();
    $('#hover-content>*').click(Images.close);
  },

  close: _ => {
    $('#hover-content').html('').hide();
  }
}

// Events
$(document).on('templates_loaded', Images.view);

// IPC Calls
ipc.on('selected-directory', (event, files) => {
  let i;
  for (i = 0; i < files.length; i++) {
    Images.add(files[i]);
    console.log('Opened image ' + files[i]);
  }
  Images.view();
});

export default Images;
