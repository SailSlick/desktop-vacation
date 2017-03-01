import { ipcRenderer as ipc } from 'electron';
import DbConn from './db';
import Galleries from '../models/galleries';

let hostCol;

const hostname = 'Sully';
const BASE_GALLERY_ID = 1;

export default {
  set: (galleryId) => {
    hostCol.findOne({ username: hostname }, (oldHostData) => {
      let mTime = oldHostData.timer;

      if (mTime <= 0 || isNaN(mTime)) {
        mTime = 5;
      }
      if (galleryId === '' || typeof galleryId !== 'number') {
        console.error(`Invalid gallery ID ${galleryId}`);
        return;
      }

      const msTime = mTime * 60000;
      const hostData = {
        slideshowConfig: {
          onstart: true,
          galleryName: galleryId,
          timer: msTime
        }
      };

      // puts the config files into the host db
      hostCol.updateOne({ username: hostname }, hostData, (updated) => {
        console.log('updated:', updated);
        // gets the named gallery from db
        Galleries.get(galleryId, gallery =>
          Galleries.expand(gallery, (subgalleries, images) => {
            const image_paths = images.map(image => image.location);

            if (image_paths.length === 0) {
              console.error('The gallery has no images');
              return;
            }
            ipc.send('set-slideshow', image_paths, msTime);
          })
        );
      });
    });
    hostCol.save(() => {});
  },

  clear: () => {
    const hostData = {
      slideshowConfig: {
        onstart: false,
        galleryName: BASE_GALLERY_ID,
        timer: 0
      }
    };
    // puts the config files into the host db
    hostCol.updateOne({ username: hostname }, hostData, () =>
      ipc.send('clearSlideshow')
    );
    hostCol.save();
  }
};

// Events
document.addEventListener('vacation_loaded', () => {
  hostCol = new DbConn('host');
}, false);

ipc.on('set-slideshow-done', (event, exitCode) => {
  console.log(`Slideshow set. exit code ${exitCode}`);
});
