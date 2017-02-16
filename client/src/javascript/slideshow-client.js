import { ipcRenderer as ipc } from 'electron';
import $ from 'jquery';
import DbConn from './db';

let hostCol;
let imageCol;
let galleryCol;

const hostname = 'Sully';

export default {
  setSlideshow: (galName) => {
    hostCol.findOne({ username: hostname }, (oldHostData) => {
      let mTime = oldHostData.timer;

      if (mTime <= 0 || isNaN(mTime)) {
        mTime = 30;
      }
      if (galName === '' || $.type(galName) !== 'string') {
        console.log('Invalid db_name, switching to base db');
        galName = hostname.concat('_all');
      }

      const msTime = mTime * 60000;
      const hostData = {
        slideshowConfig: {
          onstart: true,
          galleryName: galName,
          timer: msTime
        }
      };

      // puts the config files into the host db
      hostCol.updateOne({ username: hostname }, hostData, (updated) => {
        console.log('updated:', updated);
        // array to store filepaths of each image in gallery
        const slideshow_paths_array = [];

        // gets the named gallery from db
        galleryCol.findOne({ name: updated.slideshowConfig.galleryName }, (gallery) => {
          // loop through each image id in the gallery
          gallery.images.forEach((image_id) => {
            // find the image in the imagedb using its unique id and add path to array
            imageCol.findOne({ $loki: image_id }, (image_doc) => {
              slideshow_paths_array.push(image_doc.location);
            });
          });
          if (slideshow_paths_array.length === 0) {
            console.error('The gallery has no images');
            return;
          }
          ipc.send('set-slideshow', slideshow_paths_array, updated.slideshowConfig.timer);
        });
      });
    });
    hostCol.save(() => {});
  },

  clearSlideshow: () => {
    const hostData = {
      slideshowConfig: {
        onstart: false,
        galleryName: hostname.concat('_all'),
        timer: 0
      }
    };
    // puts the config files into the host db
    hostCol.updateOne({ username: hostname }, hostData, () => {
      ipc.send('clearSlideshow');
    });
    hostCol.save();
  }
};

// Events
$(document).on('vacation_loaded', () => {
  console.log('vac loaded for slideshow client');
  imageCol = new DbConn('images');
  galleryCol = new DbConn('galleries');
  hostCol = new DbConn('host');
});

ipc.on('set-slideshow-done', (event, exitCode) => {
  console.log(`Slideshow set. exit code ${exitCode}`);
  if (exitCode === 0) {
    $('#notification sst')
      .html('Slideshow set!')
      .parent().attr('class', 'alert-success');
  } else {
    $('#notification ssf')
      .html(`Failed to set slideshow, exit code ${exitCode}`)
      .parent().attr('class', 'alert-danger');
  }
  $('#notification').addClass('alert alert-dismissable fade show');
  setTimeout(
    () => $('#notification').attr('class', 'alert fade hide'),
    3000
  );
});
