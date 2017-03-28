import { ipcRenderer as ipc } from 'electron';

export default {
  set: (filePath) => {
    ipc.send('set-wallpaper', filePath);
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
