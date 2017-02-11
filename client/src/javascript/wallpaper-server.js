import fs from 'fs';
import { reduce } from 'async';
import { spawn } from 'child_process';
import { ipcMain as ipc } from 'electron';
import setters from '../config/wp_setters';

function escapePath(path) {
  return path.replace(/(["\s'$`\\])/g, '\\$1');
}

ipc.on('set-wallpaper', (event, path) => {
  // Reduce the array to the command with the best exit code
  // This allows the user to have multiple commands to set bg
  reduce(setters.slice(), -1, (memo, command, cb) => {
    if (fs.existsSync(command.path)) {
      console.log(`Attempting to set wallpaper with ${command.path}`);

      const setter_process = spawn(command.path, command.args(escapePath(path)));
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
    event.sender.send('set-wallpaper-done', exitCode)
  );
});
