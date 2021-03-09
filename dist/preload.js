"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
var _a = require("electron"), contextBridge = _a.contextBridge, ipcRenderer = _a.ipcRenderer;
contextBridge.exposeInMainWorld("spl", {
    getLocaleString: function (key) {
        return ipcRenderer.sendSync('toLocaleString', key);
    },
    searchForDevice: function () {
        ipcRenderer.send('searchForDevice');
    },
    setPayloadManually: function (newPath) {
        ipcRenderer.send('setPayloadManually', newPath);
    },
    selectPayloadFromFileSystem: function () {
        ipcRenderer.send('selectPayloadFromFileSystem');
    },
    selectLatestFusee: function () {
        ipcRenderer.send('selectLatestFusee');
    },
    selectLatestHekate: function () {
        ipcRenderer.send('selectLatestHekate');
    },
    validatePayload: function () {
        return ipcRenderer.sendSync('validatePayload');
    },
    launchPayload: function () {
        ipcRenderer.send('launchPayload');
    },
    getOSType: function () {
        return ipcRenderer.sendSync('getOSType');
    },
    payloadSendAutomatically: function () {
        return ipcRenderer.sendSync('payloadSendAutomatically');
    },
    launchDriverInstaller: function () {
        ipcRenderer.send('launchDriverInstaller');
    },
    hasDriverBeenChecked: function () {
        return ipcRenderer.sendSync('hasDriverBeenChecked');
    },
    setDriverCheckAsComplete: function () {
        ipcRenderer.send('setDriverCheckAsComplete');
    },
    quitApplication: function () {
        ipcRenderer.send('quitApplication');
    },
    // Event listeners...
    on: function (channel, func) {
        var validChannels = ['setInitialised', 'deviceStatusUpdate', 'refreshGUI',
            'showPayloadLaunchedPrompt', 'getDriverInstallerLaunchCode',
            'showToast', 'disableAllInput'];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, function (event) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                return func.apply(void 0, __spreadArray([event], args));
            });
        }
    },
});
