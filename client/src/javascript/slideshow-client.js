import { ipcRenderer as ipc } from 'electron';
import $ from 'jquery';
import DbConn from './db';

const hostCol = new DbConn('host');

const hostname = 'Sully';

export default {
  setSlideshow: (galName, mTime) => {
    if (mTime < 1) {
      mTime = 30;
    }
    if (galName === '') {
      galName = hostname.concat('_all');
    }

    mTime = 30;
    galName = hostname.concat('_all');

    console.log('setting slideshow:', galName, mTime);
    const msTime = mTime * 3600;
    const hostData = {
      slideshowConfig: {
        onstart: true,
        galleryName: galName,
        timer: msTime
      }
    };
    // puts the config files into the host db
    hostCol.updateOne({ username: hostname }, hostData, (updated) => {
      console.log('updated:', updated);
      ipc.send('set-slideshow', updated);
    });
  },

  clearSlideshow: () => {
    const hostData = {
      slideshowConfig: {
        onstart: false,
        galleryName: hostname.concat('_all'),
        timer: 0
      }
    };
    // puts the config files into the host db
    hostCol.updateOne({ username: hostname }, hostData, () => {
      ipc.send('clearSlideshow');
    });
  }
};

ipc.on('set-slideshow-done', (event, exitCode) => {
  console.log(`Background set. exit code ${exitCode}`);
  if (exitCode === 0) {
    $('#notification sst')
      .html('Slideshow set!')
      .parent().attr('class', 'alert-success');
  } else {
    $('#notification ssf')
      .html(`Failed to set slideshow, exit code ${exitCode}`)
      .parent().attr('class', 'alert-danger');
  }
  $('#notification').addClass('alert alert-dismissable fade show');
  setTimeout(
    () => $('#notification').attr('class', 'alert fade hide'),
    3000
  );
});
