const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld(
    "spl",
    {
        getLocaleString: (key) => {
            return ipcRenderer.sendSync('toLocaleString', key);
        },
        searchForDevice: () => {
            ipcRenderer.send('searchForDevice');
        },
        setPayloadManually: (newPath) => {
            ipcRenderer.send('setPayloadManually', newPath);
        },
        selectPayloadFromFileSystem: () => {
            ipcRenderer.send('selectPayloadFromFileSystem');
        },
        selectLatestFusee: () => {
            ipcRenderer.send('selectLatestFusee');
        },
        selectLatestHekate: () => {
            ipcRenderer.send('selectLatestHekate');
        },
        validatePayload: () => {
            return ipcRenderer.sendSync('validatePayload');
        },
        launchPayload: () => {
            ipcRenderer.send('launchPayload');
        },
        getOSType: () => {
            return ipcRenderer.sendSync('getOSType');
        },
        payloadSendAutomatically: () => {
            return ipcRenderer.sendSync('payloadSendAutomatically');
        },
        launchDriverInstaller: () => {
            ipcRenderer.send('launchDriverInstaller');
        },
        hasDriverBeenChecked: () => {
            return ipcRenderer.sendSync('hasDriverBeenChecked');
        },
        setDriverCheckAsComplete: () => {
            ipcRenderer.send('setDriverCheckAsComplete');
        },
        quitApplication: () => {
            ipcRenderer.send('quitApplication');
        },
        // Event listeners...
        on: (channel, func) => {
            let validChannels = ['setInitialised', 'deviceStatusUpdate', 'refreshGUI', 
                                'showPayloadLaunchedPrompt', 'getDriverInstallerLaunchCode',
                                'showToast'];
            if (validChannels.includes(channel)) {
                ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
            }
        },
    }
);