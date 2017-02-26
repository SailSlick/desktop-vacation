import fs from 'fs';
import { platform } from 'os';
import { reduce } from 'async';
import { exec } from 'child_process';
import { ipcMain as ipc } from 'electron';
import setters from '../../config/wp_setters';

function escapePath(path) {
  if (platform() !== 'win32') {
    return path.replace(/(["\s'$`])/g, '\\$1');
  }
  return path;
}

const Wallpaper = {
  set: (path, cb) => {
    //   Reduce the array to the command with the best exit code
    // This allows the user to have multiple commands to set bg
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
    }, (err, exitCode) =>
      cb(exitCode)
    );
  }
};

// Events
ipc.on('set-wallpaper', (event, path) => {
  Wallpaper.set(path, exitCode => event.sender.send('set-wallpaper-done', exitCode));
});

export default Wallpaper;
