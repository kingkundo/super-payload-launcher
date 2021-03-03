const USB = require("WEBUSB").usb;
const Swal = require('sweetalert2');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { ipcRenderer } = require('electron')
const { exec } = require('child_process');

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
var device = null;

var currentStep = 1;

// HELPERS ----------------------------------------------
function create_auto_device_find_event() {
    //clearInterval(create_auto_device_find_event);
    const interval = setInterval(function () {
        if (validateDevice()) {
            clearInterval(create_auto_device_find_event);
            return;
        }

        loadDevice();
    }, 1000);
}

window.addEventListener('load', function () {
    create_auto_device_find_event();
    loadDevice();
    doWindowsDriverCheck();
});

function reset() {
    device = null;
    payloadPath = '';
    updateSteps();
    create_auto_device_find_event();
}

function smashCompleteDialog(success) {
    reset();

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
}

function doWindowsDriverCheck() {
    var driverCheckCompleteFilePath = path.join(__dirname, 'drivercheckcomplete');

    function driverCheckAlreadyCompleted() {
        try {
            if (fs.existsSync(driverCheckCompleteFilePath)) {
                console.log('driver check already completed apparently...');
                return true;
            }
        } catch (err) { }
        return false;
    }

    function markDriverCheckCompleted() {
        fs.closeSync(fs.openSync(driverCheckCompleteFilePath, 'w'));
    }

    if (driverCheckAlreadyCompleted()) {
        return;
    }

    if ((os.type() == 'Windows_NT') && (!validateDevice())) {
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
                markDriverCheckCompleted();
                const driverprocess = exec('"' + path.join(__dirname, '/apx_driver/InstallDriver.exe') + '"', function (error, stdout, stderr) { 
                    console.log(error);
                });
                driverprocess.on('exit', function (code) {
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
                    //     markDriverCheckCompleted();
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
                console.log('denied');
                markDriverCheckCompleted();
            }
        });
    }
}

function bufferToHex(data) {
    let result = "";
    for (let i = 0; i < data.byteLength; i++)
        result += data.getUint8(i).toString(16).padStart(2, "0");
    return result;
}

async function write(data) {
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

function validateDevice() {
    return device != null;
}

function validatePayload() {
    var valid = true;

    try {
        valid = (payloadPath != '') && (fs.existsSync(payloadPath));
    } catch (err) {
        valid = false;
    }

    return valid;
}

// PRIMARY

function updateSteps() {
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

    if (validateDevice()) {
        updateButton(deviceStatusContainerDiv, true);
        deviceStatusDiv.innerHTML = 'A Switch in RCM mode has been found';
        deviceProgressDiv.style.display = 'none';
        currentStep = 2;
    } else {
        updateButton(deviceStatusContainerDiv, false);
        deviceStatusDiv.innerHTML = 'Now searching for a Switch in RCM mode';
        deviceProgressDiv.style.display = 'inline';
    }

    if (validatePayload()) {
        //updateButton(payloadButton, true, payloadPath);
        payloadButton.innerHTML = '<div class="nouserselect">' + payloadPath + '</div>';

        deviceStatusDiv.innerHTML = '<div class="nouserselect">A switch in RCM mode has been found</div>';
        currentStep = 3;
    } else {
        //updateButton(payloadButton, false, 'Select a payload .bin file');
        payloadButton.innerHTML = '<div class="nouserselect">Select a payload .bin file</div>';
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
}


async function launchPayload() {
    if (!validateDevice()) {
        console.log('The selected device is null... Cannot launch payload.');
        return;
    }

    if (!validatePayload()) {
        console.log('The selected payload path is invalid, or the payload is broken... Cannot launch payload.');
        return;
    }

    if (os.type() == 'Windows_NT') {
        const smashProcess = exec('"' + path.join(__dirname, 'TegraRcmSmash.exe' + '" ' + payloadPath), function (error, stdout, stderr) { });
        smashProcess.on('exit', function (code) {
            if (code == 0) {
                smashCompleteDialog(true);
            } else {
                smashCompleteDialog(false);
            }
        });
        return;
    }

    // Errors checked and accounted for.
    const payload = new Uint8Array(fs.readFileSync(payloadPath))
    //const payload = new Uint8Array(await readFileAsArrayBuffer(payloadFile));
    //const payload = new Uint8Array(await readFileAsArrayBuffer(p))

    //payload = hekate;

    // Time to launch the payload on the selected device...
    await device.open();
    console.log(`Connected to ${device.manufacturerName} ${device.productName}`);

    //if (device.configuration === null) {
    //    await device.selectConfiguration(1);
    //}

    await device.claimInterface(0);

    const deviceID = await device.transferIn(1, 16);
    console.log(`Device ID: ${bufferToHex(deviceID.data)}`);

    const finalRCMPayload = createRCMPayload(INTERMEZZO, payload);
    console.log('Sending payload...');

    const writeCount = await write(finalRCMPayload);
    console.log("Payload sent!");

    if (writeCount % 2 !== 1) {
        console.log("Switching to higher buffer...");
        await device.transferOut(1, new ArrayBuffer(0x1000));
    }

    console.log("Trigging vulnerability...");
    const vulnerabilityLength = 0x7000;
    try {
        const smash = await device.controlTransferIn({
            requestType: 'standard',
            recipient: 'interface',
            request: 0x00,
            value: 0x00,
            index: 0x00
        }, vulnerabilityLength);
        smashCompleteDialog(true);
    } catch (error) {
        console.log(error);
        smashCompleteDialog(false);
    }
}

async function loadDevice() {
    try {
        device = await USB.requestDevice({ filters: [{ vendorId: 0x0955 }] });
        updateSteps();
    } catch (error) {
        device = null;
        updateSteps();
        return;
    }
}

async function selectPayload() {
    payloadPath = '';
    ipcRenderer.send('show-open-dialog')

    ipcRenderer.on('fileSelected', (event, arg) => {
        payloadPath = arg;
        updateSteps();
        return;
    });

    updateSteps();
}