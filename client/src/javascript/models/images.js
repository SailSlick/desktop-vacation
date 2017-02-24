import { ipcRenderer as ipc } from 'electron';
import DbConn from '../helpers/db';

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
    return 0;
  }
};

// Events
document.addEventListener('vacation_loaded', () => {
  image_db = new DbConn('images');
  Images.image_db = image_db;
}, false);

// IPC Calls
ipc.on('selected-directory', (event, files) => {
  let i;
  for (i = 0; i < files.length; i++) {
    Images.add(files[i]);
    console.log(`Opened image ${files[i]}`);
  }
});
