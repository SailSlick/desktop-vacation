import path from 'path';
import url from 'url';
import fs from 'fs';
import reloader from 'electron-reload';
import { app, Menu, ipcMain, dialog } from 'electron';
import devMenuTemplate from './javascript/helpers/dev_menu_template';
import createWindow from './javascript/helpers/window';
import './javascript/helpers/wallpaper-server';
import './javascript/helpers/slideshow-server';

let mainWindow;

if (process.env.NODE_ENV === 'dev') {
  // Put dev userData folder in the app folder
  app.setPath('userData', path.join(__dirname, 'userData'));
  reloader(
    [path.join(__dirname, '*.js'), path.join(__dirname, 'stylesheets', '*.css')],
    {
      electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron')
    }
  );
}

// Create userdata folder
const dataPath = app.getPath('userData');
console.log('Userdata saved to ', dataPath);
if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath);

app.on('ready', () => {
  if (process.env.NODE_ENV === 'dev') {
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

ipcMain.on('get-userData-path', event =>
  event.sender.send('userData-path', app.getPath('userData'))
);
