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
        selectPayloadFromFileSystem: () => {
            ipcRenderer.send('selectPayloadFromFileSystem');
        },
        validatePayload: () => {
            return ipcRenderer.sendSync('validatePayload');
        },
        launchPayload: () => {
            ipcRenderer.send('launchPayload');
        },
        receive: (channel, func) => {
            let validChannels = ['setInitialised', 'deviceStatusUpdate', 'refreshGUI', 
                                'showPayloadLaunchedPrompt', 'getDriverInstallerLaunchCode'];
            if (validChannels.includes(channel)) {
                ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
            }
        },
        getOSType: () => {
            return ipcRenderer.sendSync('getOSType');
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
        }
    }
);