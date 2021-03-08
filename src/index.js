const { app, ipcMain, ipcRenderer } = require('electron');

// For USB bindings issue:
//node_modules/.bin/electron-rebuild

// Global developer mode toggle.
var devMode = true;

// Other globals.
SEND_PAYLOAD_IMMEDIATELY_UPON_SELECTION = true;
SWITCH_EXISTS_BADGE = ' ';

const INTERMEZZO = new Uint8Array([
    0x44, 0x00, 0x9F, 0xE5, 0x01, 0x11, 0xA0, 0xE3, 0x40, 0x20, 0x9F, 0xE5, 0x00, 0x20, 0x42, 0xE0,
    0x08, 0x00, 0x00, 0xEB, 0x01, 0x01, 0xA0, 0xE3, 0x10, 0xFF, 0x2F, 0xE1, 0x00, 0x00, 0xA0, 0xE1,
    0x2C, 0x00, 0x9F, 0xE5, 0x2C, 0x10, 0x9F, 0xE5, 0x02, 0x28, 0xA0, 0xE3, 0x01, 0x00, 0x00, 0xEB,
    0x20, 0x00, 0x9F, 0xE5, 0x10, 0xFF, 0x2F, 0xE1, 0x04, 0x30, 0x90, 0xE4, 0x04, 0x30, 0x81, 0xE4,
    0x04, 0x20, 0x52, 0xE2, 0xFB, 0xFF, 0xFF, 0x1A, 0x1E, 0xFF, 0x2F, 0xE1, 0x20, 0xF0, 0x01, 0x40,
    0x5C, 0xF0, 0x01, 0x40, 0x00, 0x00, 0x02, 0x40, 0x00, 0x00, 0x01, 0x40
]);

const RCM_PAYLOAD_ADDRESS = 0x40010000;
const INTERMEZZO_LOCATION = 0x4001F000;

var payloadPath = '';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

const createWindow = () => {
    if (SEND_PAYLOAD_IMMEDIATELY_UPON_SELECTION) {
        var height = 650;
    } else {
        var height = 750;
    }

    if (devMode) {
        var width = 960;
    } else {
        var width = 750;
    }

    // Create the browser window.
    const path = require('path');
    const { BrowserWindow } = require('electron');
    const mainWindow = new BrowserWindow({
        width: width,
        height: height,
        backgroundColor: '#121212',
        show: false,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: false,
            contextIsolation: true,
            enableRemoteModule: false,
            sandbox: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Remove the application menu if not on MacOS.
    const os = require('os');
    if (os.type() != 'Darwin') {
        mainWindow.removeMenu();
    }

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Open the DevTools.
    if (devMode) {
        mainWindow.webContents.openDevTools();
    }

    // Redirect internal URLs to an external browser.
    mainWindow.webContents.on('new-window', function (event, url) {
        event.preventDefault();
        const { shell } = require('electron');
        shell.openExternal(url);
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
};

function createMenu() {
    const { Menu/*, MenuItem*/ } = require('electron');
    const path = require('path');
    var menuJSON = require(path.join(__dirname, 'config', 'menu.json'));
    var menu = Menu.buildFromTemplate(menuJSON);
    Menu.setApplicationMenu(menu);
}

function initialiseLocalisation() {
    const path = require('path');
    const i18next = require('i18next');
    const Backend = require('i18next-fs-backend');
    i18next
        .use(Backend)
        .init({
            // debug: true,
            initImmediate: false,
            fallbackLng: 'en',
            lng: app.getLocale(),
            backend: {
                loadPath: path.join(__dirname, 'locales', '{{lng}}.json')
            }
        });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    createMenu();
    initialiseLocalisation();
    createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    //if (process.platform !== 'darwin') {
    app.quit();
    //}
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    const { BrowserWindow } = require('electron');
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// Catch uncaught exceptions -- Due to NodeJS/webusb weirdness we
// have to catch and throw away certain harmless errors.

process.on("uncaughtException", (err) => {
    if (err.message == "Can't close device with a pending request") {
        return;
    }

    const messageBoxOptions = {
        type: "error",
        title: "Error in Main process",
        message: "Something failed"
    };
    const { dialog } = require('electron');
    dialog.showMessageBox(messageBoxOptions);
    throw err;
});


// Communication with the renderer.

// Quit application.
ipcMain.on('quitApplication', (event) => {
    const { BrowserWindow } = require('electron');
    const window = BrowserWindow.getFocusedWindow();
    window.close();
});

// Get OS type.

ipcMain.on('getOSType', (event) => {
    const os = require('os');
    event.returnValue = os.type();
});

ipcMain.on('setPayloadManually', (event, newPath) => {
    payloadPath = newPath;
    if (SEND_PAYLOAD_IMMEDIATELY_UPON_SELECTION) {
        launchPayload(event);
    } else {
        event.sender.send('refreshGUI');
    }
});

ipcMain.on('payloadSendAutomatically', (event) => {
    event.returnValue = SEND_PAYLOAD_IMMEDIATELY_UPON_SELECTION;
});

// If on Windows, prompt the user to install the zadig driver.

ipcMain.on('hasDriverBeenChecked', (event) => {
    const path = require('path');
    var driverCheckCompleteFilePath = path.join(__dirname, 'drivercheckcomplete');
    try {
        const fs = require('fs');
        if (fs.existsSync(driverCheckCompleteFilePath)) {
            event.returnValue = true;
        }
    } catch (err) { }
    event.returnValue = false;
});

ipcMain.on('setDriverCheckAsComplete', (event) => {
    const path = require('path');
    var driverCheckCompleteFilePath = path.join(__dirname, 'drivercheckcomplete');
    const fs = require('fs');
    fs.closeSync(fs.openSync(driverCheckCompleteFilePath, 'w'));
});

ipcMain.on('launchDriverInstaller', (event) => {
    const path = require('path');
    const { exec } = require('child_process');
    const driverprocess = exec('"' + path.join(__dirname, 'apx_driver', 'InstallDriver.exe') + '"', function (error, stdout, stderr) {
        event.sender.send('getDriverInstallerLaunchCode', -1);
    });
    driverprocess.on('exit', function (code) {
        event.sender.send('getDriverInstallerLaunchCode', code);
    });
});


// Select a payload from a local file.

ipcMain.on('selectPayloadFromFileSystem', (event) => {
    payloadPath = '';

    const path = require('path');
    const { BrowserWindow } = require('electron');
    const window = BrowserWindow.getFocusedWindow();
    const options = {
        title: getLocaleString('select_payload_file'),
        defaultPath: path.join(__dirname, 'payloads'),
        //buttonLabel: 'Do it',
        filters: [
            { name: getLocaleString('payload_file'), extensions: ['bin'] }
        ],
        message: getLocaleString('select_payload_file')
    };

    const { dialog } = require('electron');
    dialog.showOpenDialog(window, options).then(
        result => {
            if (!result.canceled) {
                let paths = result.filePaths;
                if (paths && paths.length > 0) {
                    payloadPath = paths[0];
                    if (SEND_PAYLOAD_IMMEDIATELY_UPON_SELECTION) {
                        launchPayload(event);
                    } else {
                        event.sender.send('refreshGUI');
                    }
                }
            }
        }
    );
});

// Template function to get asset from latest GitHub release.

async function downloadAssetFromGithubLatestRelease(github_owner, github_repo, asset_name, save_path, exact_match = true) {
    const { Octokit } = require("@octokit/rest");
    var octokit = new Octokit();
    try {
        var atmosphereReleaseInfo = await octokit.request('GET /repos/{owner}/{repo}/releases/latest', {
            owner: github_owner,
            repo: github_repo
        });

        var assetsInfoJSON = atmosphereReleaseInfo.data.assets;
        for(var i = 0; i < assetsInfoJSON.length; i++) {
            var assetInfoJSON = assetsInfoJSON[i];
            if ((assetInfoJSON.name == asset_name) || ((!exact_match) && assetInfoJSON.name.includes(asset_name))) {
                const path = require('path');
                const { BrowserWindow } = require('electron');
                const { download } = require('electron-dl');

                const newFilePath = path.join(save_path, asset_name);
                const fs = require('fs');
                if (fs.existsSync(newFilePath)) {
                    fs.unlinkSync(newFilePath);
                }

                const win = BrowserWindow.getFocusedWindow();
                downloadedFile = await download(win, assetInfoJSON.browser_download_url, {
                    directory: save_path
                });

                return downloadedFile.getSavePath();
            }
        }
    } catch (err) {
        console.log(err);
        return false;
    }
}

// Download latest Fusee Gelee from Github and launch it.

async function selectLatestFusee(event) {
    const PAYLOAD_NAME = 'fusee-primary.bin'
    const path = require('path');
    const payloadDownloadFolderPath = path.join(__dirname, 'payloads', 'downloads');
    event.sender.send('showToast', getLocaleString('downloading_fusee'), 'info');
    newFuseePath = await downloadAssetFromGithubLatestRelease('Atmosphere-NX', 'Atmosphere', PAYLOAD_NAME, payloadDownloadFolderPath);
    if (newFuseePath !== false)  {
        const newPath = path.join(__dirname, 'payloads', 'downloads', ('latest-' + PAYLOAD_NAME));
        const fs = require('fs');
        await fs.promises.rename(newFuseePath, newPath);
        event.sender.send('showToast', getLocaleString('fusee_downloaded'), 'success');
        payloadPath = newPath;

        if (SEND_PAYLOAD_IMMEDIATELY_UPON_SELECTION) {
            launchPayload(event);
        } else {
            event.sender.send('refreshGUI');
        }

        return;
    }

    event.sender.send('showToast', getLocaleString('payload_download_failed'), 'error');
    return;
}

ipcMain.on('selectLatestFusee', (event) => {
    selectLatestFusee(event);
});

// Download latest Hekate from Github and launch it.

async function selectLatestHekate(event) {
    const ZIP_NAME_INCLUDES = 'hekate_ctcaer';
    const path = require('path');
    const cacheFolderPath = path.join(__dirname, 'payloads', 'downloads', 'cache');
    deleteEverythingInPath(cacheFolderPath);
    event.sender.send('showToast', getLocaleString('downloading_hekate'), 'info');
    var hekateZipFile = await downloadAssetFromGithubLatestRelease('CTCaer', 'hekate', ZIP_NAME_INCLUDES, cacheFolderPath, false);
    if (hekateZipFile !== false)  {
        event.sender.send('showToast', getLocaleString('hekate_downloaded'), 'success');
        try {
            const extract = require('extract-zip');
            await extract(hekateZipFile, { dir: cacheFolderPath });

            const fs = require('fs');
            const files = await fs.promises.readdir( cacheFolderPath );
            for (const file of files) {
                if (file.includes(ZIP_NAME_INCLUDES) && file.includes('.bin')) {
                    const newPath = path.join(__dirname, 'payloads', 'downloads', file);
                    await fs.promises.rename(path.join(cacheFolderPath, file), newPath);
                    payloadPath = newPath;

                    if (SEND_PAYLOAD_IMMEDIATELY_UPON_SELECTION) {
                        launchPayload(event);
                    } else {
                        event.sender.send('refreshGUI');
                    }

                    deleteEverythingInPath(cacheFolderPath);
                    return;
                }
            }
        } catch (err) {
            console.log(err);
        }

        event.sender.send('showToast', getLocaleString('payload_download_failed'), 'error');
        deleteEverythingInPath(cacheFolderPath);
    }
}

ipcMain.on('selectLatestHekate', (event) => {
    selectLatestHekate(event);
});

// Reset the whole process.
function reset(event) {
    payloadPath = '';
    event.sender.send('setInitialised', false);

    const os = require('os');
    if (os.type() == 'Darwin') {
        app.dock.setBadge('');
    }
}

ipcMain.on('reset', (event) => {
    reset(event);
});

// Validate the connected Switch device.

var disallowDeviceSearch = false;
async function getDevice() {
    // TODO: REMOVE THIS!!!
    //return true;

    if (disallowDeviceSearch) {
        disallowDeviceSearch = false;
        return null;
    }

    const USB = require("WEBUSB").usb;
    try {
        return await USB.requestDevice({ filters: [{ vendorId: 0x0955 }] });
    } catch (error) { }

    return null;
}

// Validate the selected payload.

function validatePayload() {
    const fs = require('fs')
    try {
        if ((payloadPath != '') && (fs.existsSync(payloadPath))) {
            return payloadPath;
        }
    } catch (err) { }

    return false;
}

ipcMain.on('validatePayload', (event) => {
    event.returnValue = validatePayload();
});

ipcMain.on('toLocaleString', (event, key) => {
    event.returnValue = getLocaleString(key);
})

// Search for a connected Nintendo Switch in RCM mode.

ipcMain.on('searchForDevice', async (event) => {
    var result = await getDevice() != null;

    const os = require('os');
    if (os.type() == 'Darwin') {
        if (result) {
            app.dock.setBadge(SWITCH_EXISTS_BADGE);
        } else {
            app.dock.setBadge('');
        }
    }

    event.sender.send('deviceStatusUpdate', result);
});

// Launch the payload.

async function launchPayload(event) {
    var device;

    function onPayloadLaunchCompletion(success) {
        event.sender.send('showPayloadLaunchedPrompt', success);
        reset(event);

        if (success) {
            console.log('The stack has been smashed!');
        } else {
            console.log('Injecting the payload and smashing the stack failed.');
        }
    }

    function loadPayloadOnWindows() {
        const path = require('path');
        const { exec } = require('child_process');
        const smashProcess = exec('"' + path.join(__dirname, 'tegrasmash', 'TegraRcmSmash.exe' + '" ' + payloadPath), function (error, stdout, stderr) { });
        smashProcess.on('exit', function (code) {
            onPayloadLaunchCompletion(code == 0);
        });
    }

    device = await getDevice();
    if (device == null) {
        console.log('The selected device is null... Cannot launch payload.');
        return;
    }

    if (!validatePayload()) {
        console.log('The selected payload path is invalid, or the payload is broken... Cannot launch payload.');
        return;
    }

    // Bodge to prevent immediately detecting the switch
    // the moment after payload injection.
    disallowDeviceSearch = true;

    const os = require('os');
    if (os.type() == 'Windows_NT') {
        loadPayloadOnWindows();
        return;
    }

    // Errors checked and accounted for.
    const fs = require('fs');
    const payload = new Uint8Array(fs.readFileSync(payloadPath))
    //payload = hekate;

    // Time to launch the payload on the selected device...
    try {
        await device.open();
        console.log(`Connected to ${device.manufacturerName} ${device.productName}`);

        await device.claimInterface(0);

        const deviceID = await device.transferIn(1, 16);
        console.log(`Device ID: ${bufferToHex(deviceID.data)}`);

        const finalRCMPayload = createRCMPayload(INTERMEZZO, payload);
        console.log('Sending payload...');

        const writeCount = await write(device, finalRCMPayload);
        console.log("Payload sent!");

        if (writeCount % 2 !== 1) {
            console.log("Switching to higher buffer...");
            await device.transferOut(1, new ArrayBuffer(0x1000));
        }
    } catch (error) {
        console.log('There was an error accessing the device.');
        onPayloadLaunchCompletion(false);
        return;
    }

    console.log("Trigging vulnerability...");
    var success = false;
    const vulnerabilityLength = 0x7000;
    try {
        const smash = await device.controlTransferIn({
            requestType: 'standard',
            recipient: 'interface',
            request: 0x00,
            value: 0x00,
            index: 0x00
        }, vulnerabilityLength);
        success = true;
    } catch (error) {
        success = error.message.includes('LIBUSB_TRANSFER_TIMED_OUT');
    }

    onPayloadLaunchCompletion(success);
}

ipcMain.on('launchPayload', async (event) => {
    await launchPayload(event);
});

// Simple helpers.

function getLocaleString(key) {
    var i18next = require('i18next');
    return i18next.t(key);
}

function bufferToHex(data) {
    let result = "";
    for (let i = 0; i < data.byteLength; i++)
        result += data.getUint8(i).toString(16).padStart(2, "0");
    return result;
}

async function write(device, data) {
    let length = data.length;
    let writeCount = 0;
    const packetSize = 0x1000;

    while (length) {
        const dataToTransmit = Math.min(length, packetSize);
        length -= dataToTransmit;

        const chunk = data.slice(0, dataToTransmit);
        data = data.slice(dataToTransmit);
        await device.transferOut(1, chunk);
        writeCount++;
    }

    return writeCount;
}

function createRCMPayload(intermezzo, payload) {
    const rcmLength = 0x30298;
    const intermezzoAddressRepeatCount = (INTERMEZZO_LOCATION - RCM_PAYLOAD_ADDRESS) / 4;

    const rcmPayloadSize = Math.ceil((0x2A8 + (0x4 * intermezzoAddressRepeatCount) + 0x1000 + payload.byteLength) / 0x1000) * 0x1000;

    const rcmPayload = new Uint8Array(new ArrayBuffer(rcmPayloadSize))
    const rcmPayloadView = new DataView(rcmPayload.buffer);

    rcmPayloadView.setUint32(0x0, rcmLength, true);

    for (let i = 0; i < intermezzoAddressRepeatCount; i++) {
        rcmPayloadView.setUint32(0x2A8 + i * 4, INTERMEZZO_LOCATION, true);
    }

    rcmPayload.set(intermezzo, 0x2A8 + (0x4 * intermezzoAddressRepeatCount));
    rcmPayload.set(payload, 0x2A8 + (0x4 * intermezzoAddressRepeatCount) + 0x1000);

    return rcmPayload;
}

function deleteEverythingInPath(dirPath) {
    const fs = require('fs');
    try { var files = fs.readdirSync(dirPath); }
    catch (e) { return; }
    if (files.length > 0)
        for (var i = 0; i < files.length; i++) {
            var filePath = dirPath + '/' + files[i];
            if (fs.statSync(filePath).isFile())
                fs.unlinkSync(filePath);
            else
                deleteEverythingInPath(filePath);
        }
    fs.rmdirSync(dirPath);
};