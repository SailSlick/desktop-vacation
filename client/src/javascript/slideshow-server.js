import { ipcMain as ipc } from 'electron';
import DbConn from './db';
import Wallpaper from './wallpaper-server';

const imageCol = new DbConn('images');
const galleryCol = new DbConn('galleries');

let main_loop;

ipc.on('set-slideshow', (event, hostData) => {
  // array to store filepaths of each image in gallery
  const slideshow_paths_array = [];

  // gets the named gallery from db
  galleryCol.findOne({ name: hostData.slideshowConfig.galleryName }, (gallery) => {
    // loop through each image id in the gallery
    for (const image_id of gallery.images) {
      // find the image in the imagedb using its unique id and add path to array
      imageCol.findOne({ $loki: image_id }, (image_doc) => {
        slideshow_paths_array.push(image_doc.location);
      });
    }
    event.sender.send('set-slideshow-done', 0);

    console.log('entering loop');
    let index = 0;
    if (slideshow_paths_array.length === 0) {
      console.log('WTF');
      return;
    }

    if (main_loop) {
      clearInterval(main_loop);
    }

    main_loop = setInterval(() => {
      Wallpaper.set(slideshow_paths_array[index], (exitCode) => {
        if (exitCode !== 0) {
          console.log('Failed to set background', exitCode);
        }
        if (index === slideshow_paths_array.length) {
          index = 0;
        } else {
          index += 1;
        }
      });
    }, hostData.slideshowConfig.timer);
  });
});

ipc.on('clearSlideshow', (event) => {
  console.log('clearing slideshow');
  clearInterval(main_loop);
  event.sender.send('set-slideshow-done');
});
