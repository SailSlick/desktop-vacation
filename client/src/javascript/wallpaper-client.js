import { ipcRenderer as ipc } from 'electron';
import $ from 'jquery';

export default {
  set: path => ipc.send('set-wallpaper', path),

  get: () => 'not yet implemented'
};

ipc.on('set-wallpaper-done', (event, exitCode) => {
  console.log(`Background set. exit code ${exitCode}`);
  if (exitCode === 0) {
    $('#notification p')
      .append('Background set!')
      .parent().attr('class', 'alert-success');
  } else {
    $('#notification p')
      .append(`Failed to set background, exit code ${exitCode}`)
      .parent().attr('class', 'alert-danger');
  }
  $('#notification').addClass('alert alert-dismissable fade show');
  setTimeout(
    () => $('#notification').attr('class', 'alert fade hide'),
    3000
  );
});
