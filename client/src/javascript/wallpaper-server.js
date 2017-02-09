import fs from 'fs';
import { spawn } from 'child_process';
import { ipcMain as ipc } from 'electron';
import setters from '../config/wp_setters';

function escapePath(path) {
  return path.replace(/(["\s'$`\\])/g, '\\$1');
}

ipc.on('set-wallpaper', (event, path) => {
  let i;
  for (i = 0; i < setters.length; i++) {
    const command = setters[i];
    if (fs.existsSync(command.path)) {
      console.log(`Attempting to set wallpaper with ${command.path}`);

      const setter_process = spawn(command.path, command.args(escapePath(path)));
      setter_process.on('exit', (code) => {
        console.log(`Setter finished with exit code ${code}`);
        event.sender.send('set-wallpaper-done', code);
      });

      // Print the output of the command to the log for debugging
      setter_process.stdout.on('data', data => console.log(data.toString()));
    }
  }
});
