import { ipcRenderer as ipc } from 'electron';
import sync from './sync';

export default {
  set: (filePath) => {
    if (filePath[0] === '/') {
      ipc.send('set-wallpaper', filePath);
    } else if (filePath[0] === 'h') {
      sync.urlToFile(filePath, (err, realPath) => {
        ipc.send('set-wallpaper', realPath);
      });
    }
  },

  get: () => 'not yet implemented'
};

ipc.on('set-wallpaper-done', (event, exitCode) => {
  console.log(`Background set. exit code ${exitCode}`);
  // if (exitCode === 0) {
  //   notify('Background set!');
  // } else {
  //   notify(`Failed to set background, exit code ${exitCode}`, 'alert-danger');
  // }
});
