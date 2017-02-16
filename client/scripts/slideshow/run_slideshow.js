import fs from 'fs';
import { exec } from 'child_process';
import { reduce } from 'async';
import DbConn from './db';
import setters from '../config/wp_setters';

// sleep expects milliseconds
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function set_background(path) {
  reduce(setters.slice(), -1, (memo, command, cb) => {
    if (fs.existsSync(command.path)) {
      console.log(`Attempting to set wallpaper with ${command.path}`);

      const args = command.args(path).join(' ');

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

// function that takes the name of the gallery for slideshow and time to change
function slideshow(galleryName, time) {

}
