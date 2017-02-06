import path from 'path';
import url from 'url';
import { app, Menu, ipcMain, dialog } from 'electron';
import { devMenuTemplate } from './menu/dev_menu_template';
import { editMenuTemplate } from './menu/edit_menu_template';
import createWindow from './helpers/window';
import env from './helpers/env';

var mainWindow;

var setApplicationMenu = function () {
    var menus = [editMenuTemplate];
    if (env.name !== 'production') {
        menus.push(devMenuTemplate);
    }
    Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== 'production') {
    var userDataPath = app.getPath('userData');
    app.setPath('userData', userDataPath + ' (' + env.name + ')');
}

app.on('ready', function () {
    setApplicationMenu();

    var mainWindow = createWindow('main', {
        width: 800,
        height: 600
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'app.html'),
        protocol: 'file:',
        slashes: true
    }));

    if (env.name === 'development') {
        mainWindow.openDevTools();
    }
});

app.on('window-all-closed', function () {
    app.quit();
});

ipcMain.on('open-file-dialog', function (event) {
  dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{name: 'Images', extensions: ['jpg', 'png']}]
  }, function (files) {
    if (files) event.sender.send('selected-directory', files)
  });
});
