import { map } from 'async';
import { ipcRenderer as ipc } from 'electron';
import Host from '../models/host';
import Galleries from '../models/galleries';
import Sync from './sync';
import { danger } from './notifier';

const hostIndex = 1;

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
        Galleries.get(galleryId, gallery =>
          Galleries.expand(gallery, {}, (subgalleries, images) =>
            map(images, (image, next) => {
              if (image.location) return next(null, image.location);
              return Sync.downloadImage(image.remoteId, gallery.remoteId, next);
            }, (err, imagePaths) => {
              if (err) {
                danger(err);
                return cb();
              }
              if (imagePaths.length === 0) {
                danger('The gallery has no images');
                return cb();
              }
              ipc.send('set-slideshow', imagePaths, timer);
              return cb();
            })
          )
        );
      });
    });
  },

  clear: (cb) => {
    Host.getIndex(hostIndex, (host) => {
      host.slideshowConfig.onstart = false;
      host.slideshowConfig.galleryName = Galleries.BASE_GALLERY_ID;
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
