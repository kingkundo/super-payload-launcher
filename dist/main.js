"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var _a = require('electron'), BrowserWindow = _a.BrowserWindow, ipcMain = _a.ipcMain;
// For USB bindings issue:
//node_modules/.bin/electron-rebuild
// Globals.
var DEV_MODE = false;
var SEND_PAYLOAD_IMMEDIATELY_UPON_SELECTION = true;
var SWITCH_EXISTS_BADGE = ' ';
var INTERMEZZO = new Uint8Array([
    0x44, 0x00, 0x9F, 0xE5, 0x01, 0x11, 0xA0, 0xE3, 0x40, 0x20, 0x9F, 0xE5, 0x00, 0x20, 0x42, 0xE0,
    0x08, 0x00, 0x00, 0xEB, 0x01, 0x01, 0xA0, 0xE3, 0x10, 0xFF, 0x2F, 0xE1, 0x00, 0x00, 0xA0, 0xE1,
    0x2C, 0x00, 0x9F, 0xE5, 0x2C, 0x10, 0x9F, 0xE5, 0x02, 0x28, 0xA0, 0xE3, 0x01, 0x00, 0x00, 0xEB,
    0x20, 0x00, 0x9F, 0xE5, 0x10, 0xFF, 0x2F, 0xE1, 0x04, 0x30, 0x90, 0xE4, 0x04, 0x30, 0x81, 0xE4,
    0x04, 0x20, 0x52, 0xE2, 0xFB, 0xFF, 0xFF, 0x1A, 0x1E, 0xFF, 0x2F, 0xE1, 0x20, 0xF0, 0x01, 0x40,
    0x5C, 0xF0, 0x01, 0x40, 0x00, 0x00, 0x02, 0x40, 0x00, 0x00, 0x01, 0x40
]);
var RCM_PAYLOAD_ADDRESS = 0x40010000;
var INTERMEZZO_LOCATION = 0x4001F000;
var Main = /** @class */ (function () {
    function Main() {
    }
    // Main application class constructor.
    Main.main = function (app, browserWindow) {
        var _this = this;
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
        ipcMain.on('quitApplication', function (event) { return Main.quitApplication(); });
        ipcMain.on('getOSType', function (event) { return Main.getOSType(event); });
        ipcMain.on('setPayloadManually', function (event, newPath) { return Main.setPayloadManually(event, newPath); });
        ipcMain.on('payloadSendAutomatically', function (event) { return Main.isPayloadSendAutomatically(event); });
        ipcMain.on('hasDriverBeenChecked', function (event) { return Main.hasDriverBeenChecked(event); });
        ipcMain.on('setDriverCheckAsComplete', function (event) { return Main.setDriverCheckAsComplete(event); });
        ipcMain.on('launchDriverInstaller', function (event) { return Main.launchDriverInstaller(event); });
        ipcMain.on('selectPayloadFromFileSystem', function (event) { return Main.selectPayloadFromFileSystem(event); });
        ipcMain.on('selectLatestFusee', function (event) { return Main.selectLatestFusee(event); });
        ipcMain.on('selectLatestHekate', function (event) { return Main.selectLatestHekate(event); });
        ipcMain.on('reset', function (event) { return Main.reset(event); });
        ipcMain.on('validatePayload', function (event) { return event.returnValue = Main.validatePayload(); });
        ipcMain.on('toLocaleString', function (event, key) { return event.returnValue = Main.getLocaleString(key); });
        ipcMain.on('searchForDevice', function (event) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, Main.searchForDevice(event)];
        }); }); });
        ipcMain.on('launchPayload', function (event) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Main.launchPayload(event)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        }); }); });
        process.on("uncaughtException", function (err) {
            if (err.message == "Can't close device with a pending request") {
                return;
            }
            var messageBoxOptions = {
                type: "error",
                title: "Error in Main process",
                message: "Something failed"
            };
            var dialog = require('electron').dialog;
            dialog.showMessageBox(messageBoxOptions);
            throw err;
        });
    };
    // Called when every single window is closed.
    Main.onWindowAllClosed = function () {
        if (process.platform !== 'darwin') {
            Main.quitApplication();
        }
    };
    Main.quitApplication = function () {
        Main.application.quit();
    };
    Main.getOSType = function (event) {
        var os = require('os');
        if (event != null) {
            event.returnValue = os.type();
        }
    };
    // When the application is focused on.
    Main.onActivate = function () {
        if (BrowserWindow.getAllWindows().length === 0) {
            Main.createWindow();
        }
    };
    Main.createWindow = function () {
        var path = require('path');
        // Create the application's main window.
        if (SEND_PAYLOAD_IMMEDIATELY_UPON_SELECTION) {
            var height = 650;
        }
        else {
            var height = 750;
        }
        if (DEV_MODE) {
            var width = 900;
        }
        else {
            var width = 800;
        }
        // Create the browser window.
        Main.mainWindow = new BrowserWindow({
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
        var os = require('os');
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
            var shell = require('electron').shell;
            shell.openExternal(url);
        });
        Main.mainWindow.once('ready-to-show', function () {
            Main.mainWindow.show();
        });
    };
    // Called when the application initialisation is done.
    Main.onReady = function () {
        var Menu = require('electron').Menu;
        var path = require('path');
        // Set up the application's menu.
        var menuJSON = [
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
        ];
        var menu = Menu.buildFromTemplate(menuJSON);
        Menu.setApplicationMenu(menu);
        // Set up internationalisation.
        var i18next = require('i18next');
        var Backend = require('i18next-fs-backend');
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
    };
    Main.reset = function (event) {
        Main.payloadPath = '';
        event.sender.send('setInitialised', false);
        var os = require('os');
        if (os.type() == 'Darwin') {
            Main.application.dock.setBadge('');
        }
    };
    Main.isPayloadSendAutomatically = function (event) {
        event.returnValue = SEND_PAYLOAD_IMMEDIATELY_UPON_SELECTION;
        return SEND_PAYLOAD_IMMEDIATELY_UPON_SELECTION;
    };
    Main.setPayloadManually = function (event, newPath) {
        Main.payloadPath = newPath;
        if (SEND_PAYLOAD_IMMEDIATELY_UPON_SELECTION) {
            Main.launchPayload(event);
        }
        else {
            event.sender.send('refreshGUI');
        }
    };
    Main.hasDriverBeenChecked = function (event) {
        var path = require('path');
        var driverCheckCompleteFilePath = path.join(__dirname, 'drivercheckcomplete');
        try {
            var fs = require('fs');
            if (fs.existsSync(driverCheckCompleteFilePath)) {
                event.returnValue = true;
                return true;
            }
        }
        catch (err) { }
        event.returnValue = false;
        return false;
    };
    Main.setDriverCheckAsComplete = function (event) {
        var path = require('path');
        var driverCheckCompleteFilePath = path.join(__dirname, 'drivercheckcomplete');
        var fs = require('fs');
        fs.closeSync(fs.openSync(driverCheckCompleteFilePath, 'w'));
    };
    Main.launchDriverInstaller = function (event) {
        var path = require('path');
        var exec = require('child_process').exec;
        var driverprocess = exec('"' + path.join(__dirname, 'apx_driver', 'InstallDriver.exe') + '"', function (error, stdout, tderrs) {
            event.sender.send('getDriverInstallerLaunchCode', -1);
        });
        driverprocess.on('exit', function (code) {
            event.sender.send('getDriverInstallerLaunchCode', code);
        });
    };
    Main.selectPayloadFromFileSystem = function (event) {
        Main.payloadPath = '';
        var path = require('path');
        var options = {
            title: Main.getLocaleString('select_payload_file'),
            defaultPath: path.join(__dirname, 'payloads'),
            //buttonLabel: 'Do it',
            filters: [
                { name: Main.getLocaleString('payload_file'), extensions: ['bin'] }
            ],
            message: Main.getLocaleString('select_payload_file')
        };
        var dialog = require('electron').dialog;
        dialog.showOpenDialog(Main.mainWindow, options).then(function (result) {
            if (!result.canceled) {
                var paths = result.filePaths;
                if (paths && paths.length > 0) {
                    Main.payloadPath = paths[0];
                    if (SEND_PAYLOAD_IMMEDIATELY_UPON_SELECTION) {
                        Main.launchPayload(event);
                    }
                    else {
                        event.sender.send('refreshGUI');
                    }
                }
            }
        });
    };
    Main.selectLatestFusee = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var PAYLOAD_NAME, path, payloadDownloadFolderPath, newFuseePath, newPath, fs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        event.sender.send('disableAllInput', true);
                        PAYLOAD_NAME = 'fusee-primary.bin';
                        path = require('path');
                        payloadDownloadFolderPath = path.join(__dirname, 'payloads', 'downloads');
                        event.sender.send('showToast', Main.getLocaleString('downloading_fusee'), 'info');
                        return [4 /*yield*/, Main.downloadAssetFromGithubLatestRelease('Atmosphere-NX', 'Atmosphere', PAYLOAD_NAME, payloadDownloadFolderPath)];
                    case 1:
                        newFuseePath = _a.sent();
                        if (!(newFuseePath !== false)) return [3 /*break*/, 3];
                        newPath = path.join(__dirname, 'payloads', 'downloads', ('latest-' + PAYLOAD_NAME));
                        fs = require('fs');
                        return [4 /*yield*/, fs.promises.rename(newFuseePath, newPath)];
                    case 2:
                        _a.sent();
                        event.sender.send('showToast', Main.getLocaleString('fusee_downloaded'), 'success');
                        Main.payloadPath = newPath;
                        if (SEND_PAYLOAD_IMMEDIATELY_UPON_SELECTION) {
                            Main.launchPayload(event);
                        }
                        else {
                            event.sender.send('refreshGUI');
                        }
                        event.sender.send('disableAllInput', false);
                        return [2 /*return*/];
                    case 3:
                        event.sender.send('disableAllInput', false);
                        event.sender.send('showToast', Main.getLocaleString('payload_download_failed'), 'error');
                        return [2 /*return*/];
                }
            });
        });
    };
    Main.selectLatestHekate = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var ZIP_NAME_INCLUDES, path, cacheFolderPath, hekateZipFile, extract, fs, files, _i, files_1, file, newPath, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        event.sender.send('disableAllInput', true);
                        ZIP_NAME_INCLUDES = 'hekate_ctcaer';
                        path = require('path');
                        cacheFolderPath = path.join(__dirname, 'payloads', 'downloads', 'cache');
                        Main.deleteEverythingInPath(cacheFolderPath);
                        event.sender.send('showToast', Main.getLocaleString('downloading_hekate'), 'info');
                        return [4 /*yield*/, Main.downloadAssetFromGithubLatestRelease('CTCaer', 'hekate', ZIP_NAME_INCLUDES, cacheFolderPath, false)];
                    case 1:
                        hekateZipFile = _a.sent();
                        if (!(hekateZipFile !== false)) return [3 /*break*/, 11];
                        event.sender.send('showToast', Main.getLocaleString('hekate_downloaded'), 'success');
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 9, , 10]);
                        extract = require('extract-zip');
                        return [4 /*yield*/, extract(hekateZipFile, { dir: cacheFolderPath })];
                    case 3:
                        _a.sent();
                        fs = require('fs');
                        return [4 /*yield*/, fs.promises.readdir(cacheFolderPath)];
                    case 4:
                        files = _a.sent();
                        _i = 0, files_1 = files;
                        _a.label = 5;
                    case 5:
                        if (!(_i < files_1.length)) return [3 /*break*/, 8];
                        file = files_1[_i];
                        if (!(file.includes(ZIP_NAME_INCLUDES) && file.includes('.bin'))) return [3 /*break*/, 7];
                        newPath = path.join(__dirname, 'payloads', 'downloads', file);
                        return [4 /*yield*/, fs.promises.rename(path.join(cacheFolderPath, file), newPath)];
                    case 6:
                        _a.sent();
                        Main.payloadPath = newPath;
                        if (SEND_PAYLOAD_IMMEDIATELY_UPON_SELECTION) {
                            Main.launchPayload(event);
                        }
                        else {
                            event.sender.send('refreshGUI');
                        }
                        event.sender.send('disableAllInput', false);
                        Main.deleteEverythingInPath(cacheFolderPath);
                        return [2 /*return*/];
                    case 7:
                        _i++;
                        return [3 /*break*/, 5];
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        err_1 = _a.sent();
                        console.log(err_1);
                        return [3 /*break*/, 10];
                    case 10:
                        event.sender.send('disableAllInput', false);
                        event.sender.send('showToast', Main.getLocaleString('payload_download_failed'), 'error');
                        Main.deleteEverythingInPath(cacheFolderPath);
                        _a.label = 11;
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    Main.validatePayload = function () {
        var fs = require('fs');
        try {
            if ((Main.payloadPath != '') && (fs.existsSync(Main.payloadPath))) {
                return Main.payloadPath;
            }
        }
        catch (err) { }
        return false;
    };
    Main.getDevice = function () {
        return __awaiter(this, void 0, void 0, function () {
            var USB, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        USB = require("WEBUSB").usb;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, USB.requestDevice({ filters: [{ vendorId: 0x0955 }] })];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_1 = _a.sent();
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/, null];
                }
            });
        });
    };
    Main.searchForDevice = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var result, os;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Main.getDevice()];
                    case 1:
                        result = (_a.sent()) != null;
                        os = require('os');
                        if (os.type() == 'Darwin') {
                            if (result) {
                                Main.application.dock.setBadge(SWITCH_EXISTS_BADGE);
                            }
                            else {
                                Main.application.dock.setBadge('');
                            }
                        }
                        event.sender.send('deviceStatusUpdate', result);
                        return [2 /*return*/];
                }
            });
        });
    };
    Main.launchPayload = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            function onPayloadLaunchCompletion(success) {
                event.sender.send('showPayloadLaunchedPrompt', success);
                Main.reset(event);
                event.sender.send('disableAllInput', false);
                if (success) {
                    console.log('The stack has been smashed!');
                }
                else {
                    console.log('Injecting the payload and smashing the stack failed.');
                }
            }
            function loadPayloadOnWindows() {
                var path = require('path');
                var exec = require('child_process').exec;
                var command = '"' + path.join(__dirname, 'tegrasmash', 'TegraRcmSmash.exe') + '" -w "' + Main.payloadPath + '"';
                var smashProcess = exec(command, function (error, stdout, stderr) { });
                smashProcess.on('exit', function (code) {
                    onPayloadLaunchCompletion(code == 0);
                });
            }
            var device, os, fs, payload, deviceID, finalRCMPayload, writeCount, error_2, success, vulnerabilityLength, smash, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Main.getDevice()];
                    case 1:
                        device = _a.sent();
                        if (device == null) {
                            console.log('The selected device is null... Cannot launch payload.');
                            return [2 /*return*/];
                        }
                        if (!Main.validatePayload()) {
                            console.log('The selected payload path is invalid, or the payload is broken... Cannot launch payload.');
                            return [2 /*return*/];
                        }
                        // Disable all input while we inject the payload.
                        // We reenable in the function that alerts the user to the success or failure.
                        event.sender.send('disableAllInput', true);
                        os = require('os');
                        if (os.type() == 'Windows_NT') {
                            loadPayloadOnWindows();
                            return [2 /*return*/];
                        }
                        fs = require('fs');
                        payload = new Uint8Array(fs.readFileSync(Main.payloadPath));
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 9, , 10]);
                        return [4 /*yield*/, device.open()];
                    case 3:
                        _a.sent();
                        console.log("Connected to " + device.manufacturerName + " " + device.productName);
                        return [4 /*yield*/, device.claimInterface(0)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, device.transferIn(1, 16)];
                    case 5:
                        deviceID = _a.sent();
                        finalRCMPayload = Main.createRCMPayload(payload);
                        console.log('Sending payload...');
                        return [4 /*yield*/, Main.write(device, finalRCMPayload)];
                    case 6:
                        writeCount = _a.sent();
                        console.log("Payload sent!");
                        if (!(writeCount % 2 !== 1)) return [3 /*break*/, 8];
                        console.log("Switching to higher buffer...");
                        return [4 /*yield*/, device.transferOut(1, new ArrayBuffer(0x1000))];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        error_2 = _a.sent();
                        console.log('There was an error accessing the device.');
                        onPayloadLaunchCompletion(false);
                        return [2 /*return*/];
                    case 10:
                        console.log("Trigging vulnerability...");
                        success = false;
                        vulnerabilityLength = 0x7000;
                        _a.label = 11;
                    case 11:
                        _a.trys.push([11, 13, , 14]);
                        return [4 /*yield*/, device.controlTransferIn({
                                requestType: 'standard',
                                recipient: 'interface',
                                request: 0x00,
                                value: 0x00,
                                index: 0x00
                            }, vulnerabilityLength)];
                    case 12:
                        smash = _a.sent();
                        success = true;
                        return [3 /*break*/, 14];
                    case 13:
                        error_3 = _a.sent();
                        success = error_3.message.includes('LIBUSB_TRANSFER_TIMED_OUT');
                        return [3 /*break*/, 14];
                    case 14:
                        onPayloadLaunchCompletion(success);
                        return [2 /*return*/];
                }
            });
        });
    };
    Main.downloadAssetFromGithubLatestRelease = function (github_owner, github_repo, asset_name, save_path, exact_match) {
        if (exact_match === void 0) { exact_match = true; }
        return __awaiter(this, void 0, void 0, function () {
            var Octokit, octokit, atmosphereReleaseInfo, assetsInfoJSON, i, assetInfoJSON, path, download, newFilePath, fs, downloadedFile, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        Octokit = require("@octokit/rest").Octokit;
                        octokit = new Octokit();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, octokit.request('GET /repos/{owner}/{repo}/releases/latest', {
                                owner: github_owner,
                                repo: github_repo
                            })];
                    case 2:
                        atmosphereReleaseInfo = _a.sent();
                        assetsInfoJSON = atmosphereReleaseInfo.data.assets;
                        i = 0;
                        _a.label = 3;
                    case 3:
                        if (!(i < assetsInfoJSON.length)) return [3 /*break*/, 6];
                        assetInfoJSON = assetsInfoJSON[i];
                        if (!((assetInfoJSON.name == asset_name) || ((!exact_match) && assetInfoJSON.name.includes(asset_name)))) return [3 /*break*/, 5];
                        path = require('path');
                        download = require('electron-dl').download;
                        newFilePath = path.join(save_path, asset_name);
                        fs = require('fs');
                        if (fs.existsSync(newFilePath)) {
                            fs.unlinkSync(newFilePath);
                        }
                        return [4 /*yield*/, download(Main.mainWindow, assetInfoJSON.browser_download_url, {
                                directory: save_path
                            })];
                    case 4:
                        downloadedFile = _a.sent();
                        return [2 /*return*/, downloadedFile.getSavePath()];
                    case 5:
                        i++;
                        return [3 /*break*/, 3];
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        err_2 = _a.sent();
                        console.log(err_2);
                        return [2 /*return*/, false];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    Main.getLocaleString = function (key) {
        var i18next = require('i18next');
        return i18next.t(key);
    };
    Main.write = function (device, data) {
        return __awaiter(this, void 0, void 0, function () {
            var length, writeCount, packetSize, dataToTransmit, chunk;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        length = data.length;
                        writeCount = 0;
                        packetSize = 0x1000;
                        _a.label = 1;
                    case 1:
                        if (!length) return [3 /*break*/, 3];
                        dataToTransmit = Math.min(length, packetSize);
                        length -= dataToTransmit;
                        chunk = data.slice(0, dataToTransmit);
                        data = data.slice(dataToTransmit);
                        return [4 /*yield*/, device.transferOut(1, chunk)];
                    case 2:
                        _a.sent();
                        writeCount++;
                        return [3 /*break*/, 1];
                    case 3: return [2 /*return*/, writeCount];
                }
            });
        });
    };
    Main.createRCMPayload = function (payload) {
        var rcmLength = 0x30298;
        var intermezzoAddressRepeatCount = (INTERMEZZO_LOCATION - RCM_PAYLOAD_ADDRESS) / 4;
        var rcmPayloadSize = Math.ceil((0x2A8 + (0x4 * intermezzoAddressRepeatCount) + 0x1000 + payload.byteLength) / 0x1000) * 0x1000;
        var rcmPayload = new Uint8Array(new ArrayBuffer(rcmPayloadSize));
        var rcmPayloadView = new DataView(rcmPayload.buffer);
        rcmPayloadView.setUint32(0x0, rcmLength, true);
        for (var i = 0; i < intermezzoAddressRepeatCount; i++) {
            rcmPayloadView.setUint32(0x2A8 + i * 4, INTERMEZZO_LOCATION, true);
        }
        rcmPayload.set(INTERMEZZO, 0x2A8 + (0x4 * intermezzoAddressRepeatCount));
        rcmPayload.set(payload, 0x2A8 + (0x4 * intermezzoAddressRepeatCount) + 0x1000);
        return rcmPayload;
    };
    Main.deleteEverythingInPath = function (dirPath) {
        var fs = require('fs');
        try {
            var files = fs.readdirSync(dirPath);
        }
        catch (e) {
            return;
        }
        if (files.length > 0)
            for (var i = 0; i < files.length; i++) {
                var filePath = dirPath + '/' + files[i];
                if (fs.statSync(filePath).isFile())
                    fs.unlinkSync(filePath);
                else
                    Main.deleteEverythingInPath(filePath);
            }
        fs.rmdirSync(dirPath);
    };
    Main.payloadPath = '';
    return Main;
}());
exports.default = Main;
