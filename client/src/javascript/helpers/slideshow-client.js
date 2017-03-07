import { ipcRenderer as ipc } from 'electron';
import Userdata from '../models/userdata';
import Galleries from '../models/galleries';

const hostIndex = 1;
const BASE_GALLERY_ID = 1;

export default {
  set: (galleryId, cb) => {
    cb = cb || (() => true);

    Userdata.getIndex(hostIndex, (oldHostData) => {
      console.error(oldHostData);
      let mTime = oldHostData.timer;

      if (mTime <= 0 || isNaN(mTime)) {
        mTime = 5;
      }
      if (galleryId === '' || typeof galleryId !== 'number') {
        console.error(`Invalid gallery ID ${galleryId}`);
        return cb();
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
      return Userdata.update(oldHostData.username, config, () => {
        // gets the named gallery from db
        Galleries.get(galleryId, gallery =>
          Galleries.expand(gallery, (subgalleries, images) => {
            const image_paths = images.map(image => image.location);

            if (image_paths.length === 0) {
              console.error('The gallery has no images');
              return cb();
            }
            ipc.send('set-slideshow', image_paths, msTime);
            return cb();
          })
        );
      });
    });
  },

  clear: (cb) => {
    const config = {
      slideshowConfig: {
        onstart: false,
        galleryName: BASE_GALLERY_ID,
        timer: 0
      }
    };
    Userdata.getIndex(hostIndex, (host) => {
      // puts the config files into the host db
      Userdata.update(host.username, config, () => {
        ipc.send('clear-slideshow');
        if (cb) cb();
      });
    });
  }
};

// Events
ipc.on('set-slideshow-done', (event, exitCode) => {
  console.log(`Slideshow set. exit code ${exitCode}`);
});
