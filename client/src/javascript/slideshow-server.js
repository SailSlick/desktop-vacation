import { ipcMain as ipc } from 'electron';
import DbConn from './db';

const slideshowTrue = true;
const imageCol = new DbConn('images');
const galleryCol = new DbConn('galleries');


ipc.on('set-slideshow', (event, hostData) => {
  console.log('HEREEREREREERERE');
  // array to store filepaths of each image in gallery
  const slideshow_paths_array = [];

  // gets the named gallery from db
  galleryCol.findOne({ name: hostData.slideshowConfig.galleryName }, (gallery) => {
    // loop through each image id in the gallery
    console.log("gallery:", gallery)
    for (const image_id of gallery.images) {
      console.log("image_id:", image_id)
      // find the image in the imagedb using its unique id and add path to array
      imageCol.findOne({ $loki: image_id }, (image_doc) => {
        slideshow_paths_array.push(image_doc.location);
        console.log('here');
      });
    }
    event.sender.send('set-slideshow-done');

    console.log('entering loop');
    let index = 0;
    while (slideshowTrue) {

      if (slideshow_paths_array.length === 0) {
        console.log("WTF");
        break;
      }
      console.log(index);
      setTimeout(() => {
        if (index === slideshow_paths_array.length) {
          index = 0;
        } else {
          index += 1;
        }
      }, hostData.slideshowConfig.timer);
    }
  });
});

ipc.on('clearSlideshow', (event) => {
  console.log('clearing slideshow');
  let slideshowTrue = false;
  event.sender.send('set-slideshow-done');
});
