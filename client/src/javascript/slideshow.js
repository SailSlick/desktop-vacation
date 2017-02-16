import setters from '../config/wp_setters';
import DbConn from './db';
import { exec } from 'child_process';
import fs from 'fs';

const gallery_db = new DbConn('galleries');
const image_db = new DbConn('images');

// sleep expects milliseconds
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// function that takes the name of the gallery for slideshow and time to change
function slideshow(galleryName, time) {
  // gets the named gallery from db
  gallery_db.findOne({ name: galleryName }, (gallery) => {
    // array to store filepaths of each image in gallery
    const slideshow_paths_array = [];
    // loop through each image id in the gallery
    for (const image_id in gallery.images) {
      // find the image in the imagedb using its unique id and add path to array
      image_db.findOne({ $loki: image_id }, (image_doc) => {
        slideshow_paths_array.push(image_doc.location);
      });
    }
    const index = 0;
    while (true) {
      set_background(slideshow_paths_array[index]);

      sleep(time).then(() => {
        if (index === slideshow_paths_array.length) {
          index = 0;
        } else {
          index += 1
        }
      });
    }
  });

function set_background(path) {
  reduce(setters.slice(), -1, (memo, command, cb) => {
    if (fs.existsSync(command.path)) {
      console.log(`Attempting to set wallpaper with ${command.path}`);

      const args = command.args(escapePath(path)).join(' ');

      const setter_process = exec(`${command.path} ${args}`);
      setter_process.on('exit', (code) => {
        console.log(`Setter finished with exit code ${code}`);

        // cb(errors, reduction)
        cb(null, (code === 0 || memo === -1) ? code : memo);
      });

      // Output the command's stdout to the console
      setter_process.stdout.on('data', data => console.log(data.toString()));
    } else {
      cb(null, memo);
    }
  });
}
