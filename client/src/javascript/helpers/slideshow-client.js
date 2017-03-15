import { ipcRenderer as ipc } from 'electron';
import Host from '../models/host';
import Galleries from '../models/galleries';

const hostIndex = 1;
const BASE_GALLERY_ID = 1;

export default {
  set: (galleryId, cb) => {
    cb = cb || (() => true);

    Host.getIndex(hostIndex, (oldHostData) => {
      if (isNaN(oldHostData.slideshowConfig.timer)) {
        oldHostData.slideshowConfig.timer = 5;
      }
      const timer = oldHostData.slideshowConfig.timer * 60000;
      if (galleryId === '' || typeof galleryId !== 'number') {
        console.error(`Invalid gallery ID ${galleryId}`);
        return cb();
      }
      const config = {
        slideshowConfig: {
          onstart: true,
          galleryName: galleryId,
          timer: oldHostData.slideshowConfig.timer
        }
      };

      // puts the config files into the host db
      return Host.update({ $loki: oldHostData.$loki }, config, () => {
        // gets the named gallery from db
        Galleries.get({ $loki: galleryId }, gallery =>
          Galleries.expand(gallery, (subgalleries, images) => {
            const image_paths = images.map(image => image.location);

            if (image_paths.length === 0) {
              console.error('The gallery has no images');
              return cb();
            }
            ipc.send('set-slideshow', image_paths, timer);
            return cb();
          })
        );
      });
    });
  },

  clear: (cb) => {
    Host.getIndex(hostIndex, (host) => {
      host.slideshowConfig.onstart = false;
      host.slideshowConfig.galleryName = BASE_GALLERY_ID;
      // puts the config files into the host db
      Host.update({ $loki: host.$loki }, host, () => {
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
