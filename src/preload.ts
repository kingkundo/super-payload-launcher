const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld(
    "spl",
    {
        getLocaleString: (key: string) => {
            return ipcRenderer.sendSync('toLocaleString', key);
        },
        searchForDevice: () => {
            ipcRenderer.send('searchForDevice');
        },
        setPayloadManually: (newPath: string) => {
            ipcRenderer.send('setPayloadManually', newPath);
        },
        selectFavoritePayload: () => {
            ipcRenderer.send('selectFavoritePayload');
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
        doesFavoritePayloadExist: () => {
            return ipcRenderer.sendSync('doesFavoritePayloadExist');
        },
        setPayloadAsFavorite: () => {
            ipcRenderer.send('setPayloadAsFavorite');
        },
        setDriverCheckAsComplete: () => {
            ipcRenderer.send('setDriverCheckAsComplete');
        },
        quitApplication: () => {
            ipcRenderer.send('quitApplication');
        },
        on: (channel: string, func: any) => {
            let validChannels = ['setInitialised', 'deviceStatusUpdate', 'refreshGUI', 
                                'showPayloadLaunchedPrompt', 'getDriverInstallerLaunchCode',
                                'showToast', 'disableAllInput'];
            if (validChannels.includes(channel)) {
                ipcRenderer.on(channel, (event: any, ...args: any) => func(event, ...args));
            }
        },
    }
);