import { ipcRenderer as ipc } from 'electron';
import Userdata from '../models/userdata';
import Galleries from '../models/galleries';

const hostname = 'Sully';
const BASE_GALLERY_ID = 1;

export default {
  set: (galleryId) => {
    Userdata.get(hostname, (oldHostData) => {
      let mTime = oldHostData.timer;

      if (mTime <= 0 || isNaN(mTime)) {
        mTime = 5;
      }
      if (galleryId === '' || typeof galleryId !== 'number') {
        console.error(`Invalid gallery ID ${galleryId}`);
        return;
      }

      const msTime = mTime * 60000;
      const config = {
        slideshowConfig: {
          onstart: true,
          galleryName: galleryId,
          timer: msTime
        }
      };

      // puts the config files into the host db
      Userdata.update(hostname, config, (updated) => {
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
  },

  clear: () => {
    const config = {
      slideshowConfig: {
        onstart: false,
        galleryName: BASE_GALLERY_ID,
        timer: 0
      }
    };
    // puts the config files into the host db
    Userdata.update(hostname, config, () =>
      ipc.send('clearSlideshow')
    );
  }
};

// Events
ipc.on('set-slideshow-done', (event, exitCode) => {
  console.log(`Slideshow set. exit code ${exitCode}`);
});
