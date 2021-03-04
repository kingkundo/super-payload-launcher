const { app, ipcMain } = require('electron');

// For USB bindings issue:
//node_modules/.bin/electron-rebuild

// Global developer mode toggle.
var devMode = true;

// Other globals.
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
    const path = require('path');
    if (devMode) {
        var width = 960;
        var height = 650;
    } else {
        var width = 750;
        var height = 650;
    }

    // Create the browser window.
    const { BrowserWindow } = require('electron');
    const mainWindow = new BrowserWindow({
        width: width,
        height: height,
        backgroundColor: '#121212',
        show: false,
        webPreferences: {
            nodeIntegration: true
            // nodeIntegration: false,
            // nodeIntegrationInWorker: false,
            // contextIsolation: true,
            // enableRemoteModule: false,
            // sandbox: true,
            // preload: path.join(__dirname, 'preload.js')
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
        const { shell } = require('electron');
        shell.openExternal(url);
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
    })
};

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
    const { BrowserWindow } = require('electron');
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// Communication with the renderer.

// Get OS type.

ipcMain.on('getOSType', (event) => {
    const os = require('os');
    event.returnValue = os.type();
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
    const driverprocess = exec('"' + path.join(__dirname, '/apx_driver/InstallDriver.exe') + '"', function (error, stdout, stderr) {
        event.sender.send('getDriverInstallerLaunchCode', -1);
    });
    driverprocess.on('exit', function (code) {
        event.sender.send('getDriverInstallerLaunchCode', code);
    });
});
    

// Select a payload from a local file.

ipcMain.on('selectPayload', (event) => {
    payloadPath = '';

    const { BrowserWindow } = require('electron');
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

    const { dialog } = require('electron');
    dialog.showOpenDialog(window, options).then(
        result => {
            if (!result.canceled) {
                let paths = result.filePaths;
                if (paths && paths.length > 0) {
                    payloadPath = paths[0];
                    event.sender.send('refreshGUI');
                }
            }
        }
    );
});


// Reset the whole process.

function reset(event) {
    payloadPath = '';
    event.sender.send('start_device_autosearch');
    event.sender.send('refreshGUI');
}

ipcMain.on('reset', (event) => {
    reset(event);
});

// Validate the connected Switch device.

async function getDevice() {
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

// Search for a connected Nintendo Switch in RCM mode.

ipcMain.on('searchForDevice', async (event) => {
    device = await getDevice();
    event.sender.send('deviceStatusUpdate', device != null);
    if (device != null) {
        device.close();
        device = null;
    }
});

// Launch the payload.

async function launchPayload(event) {
    function onPayloadLaunchCompletion(success) {
        reset(event);
        event.sender.send('showSmashCompleteToast', success);
        event.sender.send('refreshGUI');

        if (success) {
            console.log('The stack has been smashed!');
        } else {
            console.log('Injecting the payload and smashing the stack failed.');
        }
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

    const os = require('os');
    if (os.type() == 'Windows_NT') {
        const path = require('path');
        const { exec } = require('child_process');
        const smashProcess = exec('"' + path.join(__dirname, 'TegraRcmSmash.exe' + '" ' + payloadPath), function (error, stdout, stderr) { });
        smashProcess.on('exit', function (code) {
            if (code == 0) {
                onPayloadLaunchCompletion(true);
            } else {
                onPayloadLaunchCompletion(false);
            }
        });
        return;
    }

    // Errors checked and accounted for.
    const fs = require('fs');
    const payload = new Uint8Array(fs.readFileSync(payloadPath))
    //payload = hekate;

    // Time to launch the payload on the selected device...
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
    
    device.close().then(r => {
        onPayloadLaunchCompletion(success);
    }).catch(e => {
        onPayloadLaunchCompletion(success);
    });
}

ipcMain.on('launchPayload', async (event) => {
    await launchPayload(event);
});

// Simple helpers.

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