const { BrowserWindow, ipcMain } = require('electron');

// For USB bindings issue:
//node_modules/.bin/electron-rebuild

const DEV_MODE: boolean = false;
const SEND_PAYLOAD_IMMEDIATELY_UPON_SELECTION: boolean = true;
const SWITCH_EXISTS_BADGE = ' ';

export default class Main {

    static mainWindow: Electron.BrowserWindow;
    static application: Electron.App;
    static BrowserWindow: typeof BrowserWindow;

    static payloadPath: string = '';

    // Main application class constructor.
    static main(app: Electron.App, browserWindow: typeof BrowserWindow) {
        Main.BrowserWindow = browserWindow;
        Main.application = app;

        // Handle creating/removing shortcuts on Windows when installing/uninstalling.
        if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
            Main.quitApplication();
        }

        // Set up application listeners.
        Main.application.on('window-all-closed', Main.onWindowAllClosed);
        Main.application.on('ready', Main.onReady);

        // Set up listeners for messages from the renderer.
        ipcMain.on('quitApplication', (event) => Main.quitApplication());
        ipcMain.on('getOSType', (event) => Main.getOSType(event));
        ipcMain.on('setPayloadManually', (event, newPath) => Main.setPayloadManually(event, newPath));
        ipcMain.on('payloadSendAutomatically', (event) => Main.isPayloadSendAutomatically(event));
        ipcMain.on('hasDriverBeenChecked', (event) => Main.hasDriverBeenChecked(event));
        ipcMain.on('setDriverCheckAsComplete', (event) => Main.setDriverCheckAsComplete(event));
        ipcMain.on('launchDriverInstaller', (event) => Main.launchDriverInstaller(event));
        ipcMain.on('selectPayloadFromFileSystem', (event) => Main.selectPayloadFromFileSystem(event));
        ipcMain.on('selectLatestFusee', (event) => Main.selectLatestFusee(event));
        ipcMain.on('selectLatestHekate', (event) => Main.selectLatestHekate(event));
        ipcMain.on('reset', (event) => Main.reset(event));
        ipcMain.on('validatePayload', (event) => event.returnValue = Main.validatePayload());
        ipcMain.on('toLocaleString', (event, key) => event.returnValue = Main.getLocaleString(key));
        ipcMain.on('searchForDevice', async (event) => Main.searchForDevice(event));
        ipcMain.on('launchPayload', async (event) => await Main.launchPayload(event));

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
    }

    // Called when every single window is closed.
    private static onWindowAllClosed() {
        if (process.platform !== 'darwin') {
            Main.quitApplication();
        }
    }

    private static quitApplication() {
        Main.application.quit();
    }

    private static getOSType(event: Electron.IpcMainEvent) {
        const os = require('os');
        if (event != null) {
            event.returnValue = os.type();
        }
    }

    // When the application is focused on.
    private static onActivate() {
        if (BrowserWindow.getAllWindows().length === 0) {
            Main.createWindow();
        }
    }

    private static createWindow() {
        const path = require('path');

        // Create the application's main window.
        if (SEND_PAYLOAD_IMMEDIATELY_UPON_SELECTION) {
            var height = 650;
        } else {
            var height = 750;
        }
    
        if (DEV_MODE) {
            var width = 900;
        } else {
            var width = 800;
        }
    
        // Create the browser window.
        Main.mainWindow = new BrowserWindow({
            width: width,
            height: height,
            backgroundColor: '#121212',
            show: false,
            webPreferences: {
                nodeIntegration: false,
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
            Main.mainWindow.removeMenu();
        }
    
        // and load the index.html of the app.
        Main.mainWindow.loadFile(path.join(__dirname, 'index.html'));
    
        // Open the DevTools.
        if (DEV_MODE) {
            Main.mainWindow.webContents.openDevTools();
        }
    
        // Redirect internal URLs to an external browser.
        Main.mainWindow.webContents.on('new-window', function (event, url) {
            event.preventDefault();
            const { shell } = require('electron');
            shell.openExternal(url);
        });
    
        Main.mainWindow.once('ready-to-show', () => {
            Main.mainWindow.show();
        });
    }

    // Called when the application initialisation is done.
    private static onReady() {
        const { Menu } = require('electron');
        const path = require('path');

        // Set up the application's menu.
        const menuJSON: Electron.MenuItemConstructorOptions[] = [
            {
               "label": "Edit",
               "submenu": [
                  {
                     "role": "quit"
                  }
               ]
            },
            {
               "label": "View",
               "submenu": [
                  {
                     "role": "togglefullscreen"
                  }
               ]
            },
            {
               "role": "window",
               "submenu": [
                  {
                     "role": "minimize"
                  },
                  {
                     "role": "close"
                  }
               ]
            }
         ]
        var menu = Menu.buildFromTemplate(menuJSON);
        Menu.setApplicationMenu(menu);

        // Set up internationalisation.
        const i18next = require('i18next');
        const Backend = require('i18next-fs-backend');
        i18next
            .use(Backend)
            .init({
                // debug: true,
                initImmediate: false,
                fallbackLng: 'en',
                lng: Main.application.getLocale(),
                backend: {
                    loadPath: path.join(__dirname, 'locales', '{{lng}}.json')
                }
            });

        Main.createWindow();
    }

    private static reset(event: Electron.IpcMainEvent) {
        Main.payloadPath = '';
        event.sender.send('setInitialised', false);
    
        const os = require('os');
        if (os.type() == 'Darwin') {
            Main.application.dock.setBadge('');
        }
    }

    private static isPayloadSendAutomatically(event: Electron.IpcMainEvent) {
        event.returnValue = SEND_PAYLOAD_IMMEDIATELY_UPON_SELECTION;
        return SEND_PAYLOAD_IMMEDIATELY_UPON_SELECTION;
    }

    private static setPayloadManually(event: Electron.IpcMainEvent, newPath: string) {
        Main.payloadPath = newPath;
        if (SEND_PAYLOAD_IMMEDIATELY_UPON_SELECTION) {
            Main.launchPayload(event);
        } else {
            event.sender.send('refreshGUI');
        }
    }

    private static hasDriverBeenChecked(event: Electron.IpcMainEvent) {
        const path = require('path');
        var driverCheckCompleteFilePath = path.join(__dirname, 'drivercheckcomplete');
        try {
            const fs = require('fs');
            if (fs.existsSync(driverCheckCompleteFilePath)) {
                event.returnValue = true;
                return true;
            }
        } catch (err) { }
        event.returnValue = false;
        return false;
    }

    private static setDriverCheckAsComplete(event: Electron.IpcMainEvent) {
        const path = require('path');
        var driverCheckCompleteFilePath = path.join(__dirname, 'drivercheckcomplete');
        const fs = require('fs');
        fs.closeSync(fs.openSync(driverCheckCompleteFilePath, 'w'));
    }

    private static launchDriverInstaller(event: Electron.IpcMainEvent) {
        const path = require('path');
        const { exec } = require('child_process');
        const driverprocess = exec('"' + path.join(__dirname, 'apx_driver', 'InstallDriver.exe') + '"', function (error: string, stdout: string, tderrs: string) {
            event.sender.send('getDriverInstallerLaunchCode', -1);
        });
        driverprocess.on('exit', function (code: string) {
            event.sender.send('getDriverInstallerLaunchCode', code);
        });
    }

    private static selectPayloadFromFileSystem(event: Electron.IpcMainEvent) {
        Main.payloadPath = '';
        
        const path = require('path');
        const options = {
            title: Main.getLocaleString('select_payload_file'),
            defaultPath: path.join(__dirname, 'payloads'),
            //buttonLabel: 'Do it',
            filters: [
                { name: Main.getLocaleString('payload_file'), extensions: ['bin'] }
            ],
            message: Main.getLocaleString('select_payload_file')
        };
    
        const { dialog } = require('electron');
        dialog.showOpenDialog(Main.mainWindow, options).then(
            result => {
                if (!result.canceled) {
                    let paths = result.filePaths;
                    if (paths && paths.length > 0) {
                        Main.payloadPath = paths[0];
                        if (SEND_PAYLOAD_IMMEDIATELY_UPON_SELECTION) {
                            Main.launchPayload(event);
                        } else {
                            event.sender.send('refreshGUI');
                        }
                    }
                }
            }
        );
    }

    private static async selectLatestFusee(event: Electron.IpcMainEvent) {
        event.sender.send('disableAllInput', true);
    
        const PAYLOAD_NAME = 'fusee-primary.bin'
        const path = require('path');
        const payloadDownloadFolderPath = path.join(__dirname, 'payloads', 'downloads');
        event.sender.send('showToast', Main.getLocaleString('downloading_fusee'), 'info');
        const newFuseePath = await Main.downloadAssetFromGithubLatestRelease('Atmosphere-NX', 'Atmosphere', PAYLOAD_NAME, payloadDownloadFolderPath);
        if (newFuseePath !== false)  {
            const newPath = path.join(__dirname, 'payloads', 'downloads', ('latest-' + PAYLOAD_NAME));
            const fs = require('fs');
            await fs.promises.rename(newFuseePath, newPath);
            event.sender.send('showToast', Main.getLocaleString('fusee_downloaded'), 'success');
            Main.payloadPath = newPath;
    
            if (SEND_PAYLOAD_IMMEDIATELY_UPON_SELECTION) {
                Main.launchPayload(event);
            } else {
                event.sender.send('refreshGUI');
            }
    
            event.sender.send('disableAllInput', false);
            return;
        }
    
        event.sender.send('disableAllInput', false);
        event.sender.send('showToast', Main.getLocaleString('payload_download_failed'), 'error');
        return;
    }

    private static async selectLatestHekate(event: Electron.IpcMainEvent) {
        event.sender.send('disableAllInput', true);
    
        const ZIP_NAME_INCLUDES = 'hekate_ctcaer';
        const path = require('path');
        const cacheFolderPath = path.join(__dirname, 'payloads', 'downloads', 'cache');
        Main.deleteEverythingInPath(cacheFolderPath);
        event.sender.send('showToast', Main.getLocaleString('downloading_hekate'), 'info');
        var hekateZipFile = await Main.downloadAssetFromGithubLatestRelease('CTCaer', 'hekate', ZIP_NAME_INCLUDES, cacheFolderPath, false);
        if (hekateZipFile !== false)  {
            event.sender.send('showToast', Main.getLocaleString('hekate_downloaded'), 'success');
            try {
                const extract = require('extract-zip');
                await extract(hekateZipFile, { dir: cacheFolderPath });
    
                const fs = require('fs');
                const files = await fs.promises.readdir( cacheFolderPath );
                for (const file of files) {
                    if (file.includes(ZIP_NAME_INCLUDES) && file.includes('.bin')) {
                        const newPath = path.join(__dirname, 'payloads', 'downloads', file);
                        await fs.promises.rename(path.join(cacheFolderPath, file), newPath);
                        Main.payloadPath = newPath;
    
                        if (SEND_PAYLOAD_IMMEDIATELY_UPON_SELECTION) {
                            Main.launchPayload(event);
                        } else {
                            event.sender.send('refreshGUI');
                        }
    
                        event.sender.send('disableAllInput', false);
                        Main.deleteEverythingInPath(cacheFolderPath);
                        return;
                    }
                }
            } catch (err) {
                console.log(err);
            }
    
            event.sender.send('disableAllInput', false);
            event.sender.send('showToast', Main.getLocaleString('payload_download_failed'), 'error');
            Main.deleteEverythingInPath(cacheFolderPath);
        }
    }

    private static validatePayload() {
        const fs = require('fs')
        try {
            if ((Main.payloadPath != '') && (fs.existsSync(Main.payloadPath))) {
                return Main.payloadPath;
            }
        } catch (err) { }
    
        return false;
    }

    private static async getDevice() {
        const USB = require("WEBUSB").usb;
        try {
            return await USB.requestDevice({ filters: [{ vendorId: 0x0955 }] });
        } catch (error) { }

        return null;
    }

    private static async searchForDevice(event: Electron.IpcMainEvent) {
        var result = await Main.getDevice() != null;

        const os = require('os');
        if (os.type() == 'Darwin') {
            if (result) {
                Main.application.dock.setBadge(SWITCH_EXISTS_BADGE);
            } else {
                Main.application.dock.setBadge('');
            }
        }

        event.sender.send('deviceStatusUpdate', result);
    }

    private static async launchPayload(event: Electron.IpcMainEvent) {
        var device;
    
        function onPayloadLaunchCompletion(success: boolean) {
            event.sender.send('showPayloadLaunchedPrompt', success);
            Main.reset(event);
            event.sender.send('disableAllInput', false);
    
            if (success) {
                console.log('The stack has been smashed!');
            } else {
                console.log('Injecting the payload and smashing the stack failed.');
            }
        }
    
        function loadPayloadOnWindows() {
            const path = require('path');
            const { exec } = require('child_process');
            const command = '"' + path.join(__dirname, 'tegrasmash', 'TegraRcmSmash.exe') + '" -w "' + Main.payloadPath + '"';
            const smashProcess = exec(command, function (error: string, stdout: string, stderr: string) {});
            smashProcess.on('exit', (code: number) => {
                onPayloadLaunchCompletion(code == 0);
            });
        }
    
        device = await Main.getDevice();
        if (device == null) {
            console.log('The selected device is null... Cannot launch payload.');
            return;
        }
    
        if (!Main.validatePayload()) {
            console.log('The selected payload path is invalid, or the payload is broken... Cannot launch payload.');
            return;
        }
    
        // Disable all input while we inject the payload.
        // We reenable in the function that alerts the user to the success or failure.
        event.sender.send('disableAllInput', true);
    
        const os = require('os');
        if (os.type() == 'Windows_NT') {
            loadPayloadOnWindows();
            return;
        }
    
        // Errors checked and accounted for.
        const fs = require('fs');
        const payload = new Uint8Array(fs.readFileSync(Main.payloadPath))
        //payload = hekate;
    
        // Time to launch the payload on the selected device...
        try {
            await device.open();
            console.log(`Connected to ${device.manufacturerName} ${device.productName}`);
    
            await device.claimInterface(0);
    
            const deviceID = await device.transferIn(1, 16);
            //console.log(`Device ID: ${Main.bufferToHex(deviceID.data)}`);
    
            const finalRCMPayload = Main.createRCMPayload(payload);
            console.log('Sending payload...');
    
            const writeCount = await Main.write(device, finalRCMPayload);
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

    private static async downloadAssetFromGithubLatestRelease(github_owner: string, github_repo: string, asset_name: string, save_path: string, exact_match: boolean = true) {
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
                    const { download } = require('electron-dl');
    
                    const newFilePath = path.join(save_path, asset_name);
                    const fs = require('fs');
                    if (fs.existsSync(newFilePath)) {
                        fs.unlinkSync(newFilePath);
                    }
    
                    var downloadedFile = await download(Main.mainWindow, assetInfoJSON.browser_download_url, {
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

    private static getLocaleString(key: string) {
        var i18next = require('i18next');
        return i18next.t(key);
    }
    
    private static async write(device: USBDevice, data: Uint8Array) {
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
    
    private static createRCMPayload(payload: Uint8Array) {
        const RCM_PAYLOAD_ADDRESS = 0x40010000;
        const INTERMEZZO_LOCATION = 0x4001F000;

        const rcmLength = 0x30298;
        const intermezzoAddressRepeatCount = (INTERMEZZO_LOCATION - RCM_PAYLOAD_ADDRESS) / 4;
    
        const rcmPayloadSize = Math.ceil((0x2A8 + (0x4 * intermezzoAddressRepeatCount) + 0x1000 + payload.byteLength) / 0x1000) * 0x1000;
    
        const rcmPayload = new Uint8Array(new ArrayBuffer(rcmPayloadSize))
        const rcmPayloadView = new DataView(rcmPayload.buffer);
    
        rcmPayloadView.setUint32(0x0, rcmLength, true);
    
        for (let i = 0; i < intermezzoAddressRepeatCount; i++) {
            rcmPayloadView.setUint32(0x2A8 + i * 4, INTERMEZZO_LOCATION, true);
        }

        const INTERMEZZO = new Uint8Array([
            0x44, 0x00, 0x9F, 0xE5, 0x01, 0x11, 0xA0, 0xE3, 0x40, 0x20, 0x9F, 0xE5, 0x00, 0x20, 0x42, 0xE0,
            0x08, 0x00, 0x00, 0xEB, 0x01, 0x01, 0xA0, 0xE3, 0x10, 0xFF, 0x2F, 0xE1, 0x00, 0x00, 0xA0, 0xE1,
            0x2C, 0x00, 0x9F, 0xE5, 0x2C, 0x10, 0x9F, 0xE5, 0x02, 0x28, 0xA0, 0xE3, 0x01, 0x00, 0x00, 0xEB,
            0x20, 0x00, 0x9F, 0xE5, 0x10, 0xFF, 0x2F, 0xE1, 0x04, 0x30, 0x90, 0xE4, 0x04, 0x30, 0x81, 0xE4,
            0x04, 0x20, 0x52, 0xE2, 0xFB, 0xFF, 0xFF, 0x1A, 0x1E, 0xFF, 0x2F, 0xE1, 0x20, 0xF0, 0x01, 0x40,
            0x5C, 0xF0, 0x01, 0x40, 0x00, 0x00, 0x02, 0x40, 0x00, 0x00, 0x01, 0x40
        ]);
    
        rcmPayload.set(INTERMEZZO, 0x2A8 + (0x4 * intermezzoAddressRepeatCount));
        rcmPayload.set(payload, 0x2A8 + (0x4 * intermezzoAddressRepeatCount) + 0x1000);
    
        return rcmPayload;
    }
    
    private static deleteEverythingInPath(dirPath: string) {
        const fs = require('fs');
        try { var files = fs.readdirSync(dirPath); }
        catch (e) { return; }
        if (files.length > 0)
            for (var i = 0; i < files.length; i++) {
                var filePath = dirPath + '/' + files[i];
                if (fs.statSync(filePath).isFile())
                    fs.unlinkSync(filePath);
                else
                    Main.deleteEverythingInPath(filePath);
            }
        fs.rmdirSync(dirPath);
    }
}