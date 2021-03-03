const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const path = require('path');

// Global developer mode toggle.
var devMode = true;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

const createWindow = () => {
    if (devMode) {
        var width = 960;
        var height = 650;
    } else {
        var width = 750;
        var height = 650;
    }

    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: width,
        height: height,
        show: false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    // Remove the application menu.
    mainWindow.removeMenu();

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Open the DevTools.
    if (devMode) {
        mainWindow.webContents.openDevTools();
    }

    // Redirect internal URLs to an external browser.
    mainWindow.webContents.on('new-window', function (event, url) {
        event.preventDefault();
        shell.openExternal(url);
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    })
};

ipcMain.on('show-open-dialog', (event, arg) => {
    const window = BrowserWindow.getFocusedWindow();
    const options = {
        title: 'Select the payload file',
        //defaultPath: '/path/to/something/',
        //buttonLabel: 'Do it',
        filters: [
            { name: 'Payload file', extensions: ['bin'] }
        ],
        //message: 'This message will only be shown on macOS'
    };

    dialog.showOpenDialog(window, options).then
        (
            result => {
                if (!result.canceled) {
                    let paths = result.filePaths;
                    if (paths && paths.length > 0) {
                        window.webContents.send('fileSelected', paths[0]);
                    }
                }
            }
        );
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

app.allowRendererProcessReuse = false;