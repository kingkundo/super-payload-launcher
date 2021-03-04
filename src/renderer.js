const { ipcRenderer } = require('electron');

var currentStep = 1;
var lastDeviceStatus = false;

window.addEventListener('load', function () {
    refreshGUI();
    ipcRenderer.send('searchForDevice');
    startDeviceAutosearch();
    doWindowsSwitchDriverPrompt();
});

// The function that starts the device autosearch routine.
function startDeviceAutosearch() {
    const interval = setInterval(function () {
        // if (lastDeviceStatus) {
        //     clearInterval(startDeviceAutosearch);
        //     return;
        // }

        ipcRenderer.send('searchForDevice');
    }, 1000);
}

// Select a payload.
function selectPayload() {
    ipcRenderer.send('selectPayload');
}

// Launches the payload on a button click.
function launchPayload() {
    ipcRenderer.send('launchPayload');
}

ipcRenderer.on('deviceStatusUpdate', (event, connected) => {
    //console.log(connected);
    if (lastDeviceStatus != connected) {
        lastDeviceStatus = connected;
        refreshGUI();
    }
})

// If we are asked by main to start autosearch, we do.
ipcRenderer.on('startDeviceAutosearch', (event) => {
    startDeviceAutosearch();
});

// If we are asked by main to update the GUI, we do.
ipcRenderer.on('refreshGUI', (event) => {
    refreshGUI();
})

ipcRenderer.on('showSmashCompleteToast', (event, success) => {
    const Swal = require('sweetalert2');
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });

    if (success) {
        title = 'Payload delivered successfully! 💌';
        titleHTML = '<a class="nouserselect" style="color:var(--title-text-color);">' + title + '</a>';
        console.log(title);
        Toast.fire({
            icon: 'success',
            title: titleHTML,
            background: 'var(--main-background-color)'
        });
    } else {
        title = 'Payload delivery to the Switch failed 🍐';
        titleHTML = '<a class="nouserselect" style="color:var(--title-text-color);">' + title + '</a>';
        console.log(title);
        Toast.fire({
            icon: 'error',
            title: titleHTML,
            background: 'var(--main-background-color)'
        });
    }
});

var initialised = false;
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
    var payloadButton = document.getElementById('payloadbutton');

    if ((initialised) && (lastDeviceStatus)) {
        updateButton(deviceStatusContainerDiv, true);
        deviceStatusDiv.innerHTML = 'A Switch in RCM mode has been found';
        deviceProgressDiv.style.display = 'none';
        currentStep = 2;
    } else {
        updateButton(deviceStatusContainerDiv, false);
        deviceStatusDiv.innerHTML = 'Now searching for a Switch in RCM mode';
        deviceProgressDiv.style.display = 'inline';
    }

    payload = ((initialised) && (ipcRenderer.sendSync('validatePayload')));
    if (payload) {
        updateButton(payloadButton, true, payload);
        deviceStatusDiv.innerHTML = '<div class="nouserselect">A switch in RCM mode has been found</div>';

        // Only allow step 3 if Switch is connected.
        if (lastDeviceStatus) {
            currentStep = 3;
        }
    } else {
        updateButton(payloadButton, false, 'Select a payload .bin file');
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
            title: '<a class="nouserselect" style="color:var(--title-text-color);">Have you installed the driver?</a>',
            html: "<a class='nouserselect' style='color:var(--subtitle-text-color);'>On Windows you have to install a driver to talk to the Switch. If you haven't already, make sure to install it now. It's very simple.</a>",
            //icon: 'error',
            background: 'var(--main-background-color)',
            confirmButtonText: '<a class="nouserselect" style="color:var(--text-color);"><b>Install driver</b></a>',
            showConfirmButton: true,
            denyButtonText: "<a class='nouserselect' style='color:var(--text-color);'>It's already installed</a>",
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