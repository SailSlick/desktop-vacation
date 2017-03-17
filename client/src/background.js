import path from 'path';
import url from 'url';
import minimist from 'minimist';
import reloader from 'electron-reload';
import { app, Menu, ipcMain, dialog } from 'electron';
import devMenuTemplate from './javascript/helpers/dev_menu_template';
import createWindow from './javascript/helpers/window';
import './javascript/helpers/wallpaper-server';
import './javascript/helpers/slideshow-server';

const argv = minimist(process.argv);

let mainWindow;

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (argv.env !== 'production') {
  reloader(
    [path.join(__dirname, '*.js'), path.join(__dirname, 'stylesheets', '*.css')],
    {
      electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron')
    }
  );
  const userDataPath = app.getPath('userData');
  app.setPath('userData', `${userDataPath} (${argv.env})`);
}

app.on('ready', () => {
  if (argv.env !== 'production') {
    Menu.setApplicationMenu(Menu.buildFromTemplate([devMenuTemplate]));
  }

  mainWindow = createWindow('main', {
    width: 800,
    height: 600
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'app.html'),
    protocol: 'file:',
    slashes: true
  }));
});

app.on('window-all-closed', app.quit);

ipcMain.on('open-file-dialog', (event) => {
  dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png'] }]
  }, (files) => {
    if (files) event.sender.send('selected-directory', files);
  });
});
