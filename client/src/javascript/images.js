import { ipcRenderer as ipc } from 'electron';
import Templates from './templates';

let image_db = [];

// Exported methods
const Images = {

  getNew: _ => {
    ipc.send('open-file-dialog');
  },

  add: path => {
    image_db.push(path);
  },

  view: _ => {
 
    // Replace the main content
    $('#main-content').html(Templates.generate('image-gallery', {}));

    let i = 0;
    image_db.forEach(path => {
      $('#gallery-col-' + i).append(Templates.generate('image', {src: path}));
      i = (i + 1) % 3;
    });
  }
}

// Events
document.addEventListener('templates_loaded', Images.view, false);

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
