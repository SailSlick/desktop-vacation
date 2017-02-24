import { ipcRenderer as ipc } from 'electron';
import Notification from './notification';

const notify = Notification.show;

export default {
  set: path => ipc.send('set-wallpaper', path),

  get: () => 'not yet implemented'
};

ipc.on('set-wallpaper-done', (event, exitCode) => {
  console.log(`Background set. exit code ${exitCode}`);
  if (exitCode === 0) {
    notify('Background set!');
  } else {
    notify(`Failed to set background, exit code ${exitCode}`, 'alert-danger');
  }
});
