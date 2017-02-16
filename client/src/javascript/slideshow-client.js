import { ipcRenderer as ipc } from 'electron';
import $ from 'jquery';
import DbConn from './db';

let hostCol;

const hostname = 'Sully';

export default {
  setSlideshow: (galName, mTime) => {
    if (mTime < 1 || isNaN(mTime)) {
      mTime = 0.5;
    }
    if (galName === '' || $.type(mTime) !== 'string') {
      galName = hostname.concat('_all');
    }

    galName = hostname.concat('_all');

    const msTime = mTime * 60000;
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
    hostCol.save();
  }
};

// Events

$(document).on('vacation-loaded', () => { hostCol = new DbConn('host'); });

ipc.on('set-slideshow-done', (event, exitCode) => {
  console.log(`Slideshow set. exit code ${exitCode}`);
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
