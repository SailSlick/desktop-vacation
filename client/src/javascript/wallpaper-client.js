import { ipcRenderer as ipc } from 'electron';

export default {
  set: path => ipc.send('set-wallpaper', path),

  get: () => 'not yet implemented'
};

ipc.on('set-wallpaper-done', (event, exitCode) => {
  console.log(`Background set. exit code ${exitCode}`);
});
