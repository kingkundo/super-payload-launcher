const { ipcRenderer } = require('electron');

var currentStep = 1;
var lastDeviceStatus = false;
var initialised = false;

window.addEventListener('load', function () {
    initialised = false;
    writeTranslatedText();
    refreshGUI();
    ipcRenderer.send('searchForDevice');
    startDeviceAutosearch();
    doWindowsSwitchDriverPrompt();
});

function writeTranslatedText(){
    function updateInnerHTML(elementId, key) {
        document.getElementById(elementId).innerHTML = getLocaleString(key);
    }

    appTitle = getLocaleString('app_title');
    document.title = appTitle;
    document.getElementById('title').innerHTML = appTitle;

    updateInnerHTML('step_one_title', 'step_one_title');
    updateInnerHTML('step_one_desc', 'step_one_desc');
    updateInnerHTML('step_one_secondary_desc', 'step_one_sec_desc');
    updateInnerHTML('step_two_title', 'step_two_title');
    updateInnerHTML('launch_payload_button', 'launch_payload_button');

}

function getLocaleString(key) {
    return ipcRenderer.sendSync('toLocaleString', key);
}

function writeLocaleString(key) {
    document.write(getLocaleString(key));
}

// The function that starts the device autosearch routine.
function startDeviceAutosearch() {
    const interval = setInterval(function () {
        ipcRenderer.send('searchForDevice');
    }, 1000);
}

// Select a payload.
function selectPayloadFromFileSystem() {
    ipcRenderer.send('selectPayloadFromFileSystem');
}

// Launches the payload on a button click.
function launchPayload() {
    ipcRenderer.send('launchPayload');
}

ipcRenderer.on('setInitialised', (event, init) => {
    initialised = init;
    refreshGUI();
});

ipcRenderer.on('deviceStatusUpdate', (event, connected) => {
    if (lastDeviceStatus != connected) {
        lastDeviceStatus = connected;
        refreshGUI();
    }
})

// If we are asked by main to update the GUI, we do.
ipcRenderer.on('refreshGUI', (event) => {
    refreshGUI();
})

ipcRenderer.on('showPayloadLaunchedPrompt', (event, success) => {
    const Swal = require('sweetalert2');

    if (success) {
        title = getLocaleString('payload_delivery_success');
    } else {
        title = getLocaleString('payload_delivery_failed');
    }

    Swal.fire({
        title: '<a class="nouserselect" style="color:var(--title-text-color);">' + title + '</a>',
        icon: 'success',
        background: 'var(--main-background-color)',
        confirmButtonText: '<a class="nouserselect" style="color:var(--text-color);"><b>' + getLocaleString("launch_another_payload") + '</b></a>',
        showConfirmButton: true,
        showDenyButton: true,
        denyButtonText: '<a class="nouserselect" style="color:var(--title-text-color);">' + getLocaleString("quit_application") + '</a>',
        showCancelButton: false,
    }).then((result) => {
        if (result.isConfirmed) {
        } else if (result.isDenied) {
            ipcRenderer.send('quitApplication');
        }
    });
});

function refreshGUI() {
    function updateButton(button, confirm, text = '') {
        if (confirm) {
            button.style.border = '0.1em solid  var(--device-found-color)';
            button.style.color = 'var(--device-found-color)';
        } else {
            button.style.border = '0.1em solid var(--searching-device-color)';
            button.style.color = 'var(--searching-device-color)';
        }

        if (text != '') {
            button.innerHTML = '<div class="nouserselect">' + text + '</div>';
        }
    }

    currentStep = 1;

    var deviceStatusContainerDiv = document.getElementById('devicestatuscontainerdiv');
    var deviceStatusDiv = document.getElementById('devicestatusdiv');
    var deviceProgressDiv = document.getElementById('devicestatusprogressdiv');
    var selectPayloadFromFileSystemBtn = document.getElementById('selectPayloadFromFileSystemBtn');

    if ((initialised) && (lastDeviceStatus)) {
        updateButton(deviceStatusContainerDiv, true);
        deviceStatusDiv.innerHTML = '<div class="nouserselect">' + getLocaleString("switch_found") + '</div>';
        deviceProgressDiv.style.display = 'none';
        currentStep = 2;
    } else {
        updateButton(deviceStatusContainerDiv, false);
        deviceStatusDiv.innerHTML = '<div class="nouserselect">' + getLocaleString("searching_for_switch") + '</div>';
        deviceProgressDiv.style.display = 'inline';
    }

    payload = ((initialised) && (ipcRenderer.sendSync('validatePayload')));
    if (payload) {
        updateButton(selectPayloadFromFileSystemBtn, true, payload.replace(/^.*[\\\/]/, ''));
        
        // TODO: WHAT DID THIS DO? LOOKS POINTLESS AND WRONG SO COMMENTED OUT...
        //deviceStatusDiv.innerHTML = '<div class="nouserselect">A Switch in RCM mode has been found</div>';

        // Only allow step 3 if Switch is connected.
        if (lastDeviceStatus) {
            currentStep = 3;
        }
    } else {
        updateButton(selectPayloadFromFileSystemBtn, false, getLocaleString('open_local_payload'));
    }

    for (var i = 1; i < 4; i++) {
        var instructionID = 'i' + i.toString();
        var currentInstructionDiv = document.getElementById(instructionID);

        if (i == currentStep) {
            currentInstructionDiv.classList.remove('fade-out');
            currentInstructionDiv.classList.add('fade-in');
            currentInstructionDiv.classList.remove('nouserselect');
            currentInstructionDiv.style.pointerEvents = 'auto';
        } else {
            currentInstructionDiv.classList.add('fade-out')
            currentInstructionDiv.classList.remove('fade-in');
            currentInstructionDiv.classList.add('nouserselect');
            currentInstructionDiv.style.pointerEvents = 'none';
        }
    }

    initialised = true;
    //console.log('GUI refreshed!');
}

function doWindowsSwitchDriverPrompt() {
    if ((ipcRenderer.sendSync('getOSType') == 'Windows_NT') && (!ipcRenderer.sendSync('hasDriverBeenChecked'))) {
        const Swal = require('sweetalert2');
        Swal.fire({
            title: '<a class="nouserselect" style="color:var(--title-text-color);">' + getLocaleString("driver_dialog_title") + '</a>',
            html: "<a class='nouserselect' style='color:var(--subtitle-text-color);'>" + getLocaleString('driver_dialog_msg') + "</a>",
            //icon: 'error',
            background: 'var(--main-background-color)',
            confirmButtonText: '<a class="nouserselect" style="color:var(--text-color);"><b>' + getLocaleString('install_driver') + '</b></a>',
            showConfirmButton: true,
            denyButtonText: "<a class='nouserselect' style='color:var(--text-color);'>" + getLocaleString('driver_already_installed') + "</a>",
            showDenyButton: true,
            showCancelButton: false
        }).then((result) => {
            if (result.isConfirmed) {
                ipcRenderer.send('launchDriverInstaller');
                ipcRenderer.on('getDriverInstallerLaunchCode', (event, code) => {
                    ipcRenderer.send('setDriverCheckAsComplete');
                    console.log('Driver installer exit code:' + code);
                    // const Toast = Swal.mixin({
                    //     toast: true,
                    //     position: 'top-end',
                    //     showConfirmButton: false,
                    //     timer: 5000,
                    //     timerProgressBar: true,
                    //     didOpen: (toast) => {
                    //         toast.addEventListener('mouseenter', Swal.stopTimer)
                    //         toast.addEventListener('mouseleave', Swal.resumeTimer)
                    //     }
                    // });
                    // if (code == 1) {
                    //     title = 'Driver installation succeeded';
                    //     titleHTML = '<a class="nouserselect" style="color:var(--title-text-color);">' + title + '</a>';
                    //     console.log(title);
                    //     Toast.fire({
                    //         icon: 'success',
                    //         title: titleHTML,
                    //         background: 'var(--main-background-color)'
                    //     });
                    //     ipcRenderer.send('setDriverCheckAsComplete');
                    // } else {
                    //     title = 'Driver installation failed or was stopped';
                    //     titleHTML = '<a class="nouserselect" style="color:var(--title-text-color);">' + title + '</a>';
                    //     console.log(title);
                    //     Toast.fire({
                    //         icon: 'warning',
                    //         title: titleHTML,
                    //         background: 'var(--main-background-color)'
                    //     });
                    // }
                });
            } else if (result.isDenied) {
                ipcRenderer.send('setDriverCheckAsComplete');
            }
        });
    }
}