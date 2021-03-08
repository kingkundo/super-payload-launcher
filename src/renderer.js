var currentStep = 1;
var lastDeviceStatus = false;
var initialised = false;
var disableAllInput = false;

window.addEventListener('load', function () {
    initialised = false;
    writeTranslatedText();
    document.getElementById('i3').hidden = window.spl.payloadSendAutomatically();
    refreshGUI();
    window.spl.searchForDevice();
    startDeviceAutosearch();
    doWindowsSwitchDriverPrompt();
});

function writeTranslatedText() {
    function updateInnerHTML(elementId, key, innertag = '', outertag = '') {
        document.getElementById(elementId).innerHTML = innertag + window.spl.getLocaleString(key) + outertag;
    }

    appTitle = window.spl.getLocaleString('app_title');
    document.title = appTitle;
    document.getElementById('title').innerHTML = appTitle;

    updateInnerHTML('step_one_title', 'step_one_title');
    updateInnerHTML('step_one_desc', 'step_one_desc');
    updateInnerHTML('step_one_secondary_desc', 'step_one_sec_desc', '<b>', '</b>');
    updateInnerHTML('step_two_title', 'step_two_title');
    updateInnerHTML('step_three_title', 'step_three_title');
    updateInnerHTML('launch_payload_button', 'launch_payload_button');
}

function startDeviceAutosearch() {
    const interval = setInterval(function () {
        window.spl.searchForDevice();
    }, 1000);
}

window.spl.on('setInitialised', (event, init) => {
    initialised = init;
    refreshGUI();
});

window.spl.on('deviceStatusUpdate', (event, connected) => {
    if (lastDeviceStatus != connected) {
        lastDeviceStatus = connected;
        refreshGUI();
    }
});

function showToast(text, icon) {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        background: 'var(--main-background-color)',
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    })

    Toast.fire({
        icon: icon,
        title: '<a class="nouserselect" style="color:var(--title-text-color);">' + text + '</a>',
    });
}

window.spl.on('showToast', (event, text, icon) => {
    showToast(text, icon);
});

window.spl.on('disableAllInput', (event, disable) => {
    disableAllInput = disable;
    refreshGUI();
});

window.spl.on('refreshGUI', (event) => {
    refreshGUI();
});

window.spl.on('showPayloadLaunchedPrompt', (event, success) => {
    if (success) {
        title = window.spl.getLocaleString('payload_delivery_success');
    } else {
        title = window.spl.getLocaleString('payload_delivery_failed');
    }

    Swal.fire({
        title: '<a class="nouserselect" style="color:var(--title-text-color);">' + title + '</a>',
        icon: 'success',
        background: 'var(--main-background-color)',
        confirmButtonText: '<a class="nouserselect" style="color:var(--text-color);"><b>' + window.spl.getLocaleString("launch_another_payload") + '</b></a>',
        showConfirmButton: true,
        showDenyButton: true,
        denyButtonText: '<a class="nouserselect" style="color:var(--title-text-color);">' + window.spl.getLocaleString("quit_application") + '</a>',
        showCancelButton: false,
    }).then((result) => {
        if (result.isConfirmed) {
        } else if (result.isDenied) {
            window.spl.quitApplication();
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
    var selectLatestFuseeBtn = document.getElementById('selectLatestFuseeBtn');
    var selectLatestHekateBtn = document.getElementById('selectLatestHekateBtn');

    if ((initialised) && (lastDeviceStatus)) {
        updateButton(deviceStatusContainerDiv, true);
        deviceStatusDiv.innerHTML = '<div class="nouserselect">' + window.spl.getLocaleString("switch_found") + '</div>';
        deviceProgressDiv.style.display = 'none';
        currentStep = 2;
    } else {
        updateButton(deviceStatusContainerDiv, false);
        deviceStatusDiv.innerHTML = '<div class="nouserselect">' + window.spl.getLocaleString("searching_for_switch") + '</div>';
        deviceProgressDiv.style.display = 'inline';
    }

    payload = ((initialised) && (window.spl.validatePayload()));
    if (payload) {
        updateButton(selectPayloadFromFileSystemBtn, true, payload.replace(/^.*[\\\/]/, ''));

        // Only allow step 3 if Switch is connected.
        if (lastDeviceStatus) {
            currentStep = 3;
        }
    } else {
        updateButton(selectPayloadFromFileSystemBtn, false, window.spl.getLocaleString('open_local_payload'));
        updateButton(selectLatestFuseeBtn, false, window.spl.getLocaleString('get_fusee_payload'));
        updateButton(selectLatestHekateBtn, false, window.spl.getLocaleString('get_hekate_payload'))
    }

    if (disableAllInput) {
        currentStep = -1;
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
}

function doWindowsSwitchDriverPrompt() {
    if ((window.spl.getOSType() == 'Windows_NT') && (!window.spl.hasDriverBeenChecked())) {
        Swal.fire({
            title: '<a class="nouserselect" style="color:var(--title-text-color);">' + window.spl.getLocaleString("driver_dialog_title") + '</a>',
            html: "<a class='nouserselect' style='color:var(--subtitle-text-color);'>" + window.spl.getLocaleString('driver_dialog_msg') + "</a>",
            //icon: 'error',
            background: 'var(--main-background-color)',
            confirmButtonText: '<a class="nouserselect" style="color:var(--text-color);"><b>' + window.spl.getLocaleString('install_driver') + '</b></a>',
            showConfirmButton: true,
            denyButtonText: "<a class='nouserselect' style='color:var(--text-color);'>" + window.spl.getLocaleString('driver_already_installed') + "</a>",
            showDenyButton: true,
            showCancelButton: false
        }).then((result) => {
            if (result.isConfirmed) {
                window.spl.launchDriverInstaller();
                window.spl.on('getDriverInstallerLaunchCode', (event, code) => {
                    window.spl.setDriverCheckAsComplete();
                    console.log('Driver installer exit code:' + code);
                });
            } else if (result.isDenied) {
                window.spl.setDriverCheckAsComplete();
            }
        });
    }
}

// Drag drop stuff...

var dropZone = document.getElementById('dropzone');

function showDropZone() {
	dropZone.style.display = "block";
}
function hideDropZone() {
    dropZone.style.display = "none";
}

function handleDrop(e) {
    e.preventDefault();
    hideDropZone();

    if (!lastDeviceStatus) {
        showToast(window.spl.getLocaleString('no_device_no_dragdrop'), 'warning');
        return;
    }

    for (var i = 0; i < e.dataTransfer.items.length; i++) {
        if (e.dataTransfer.items[i].kind === 'file') {
            var file = e.dataTransfer.items[i].getAsFile();
            if (file.path.split('.').pop() == 'bin') {
                console.log('Payload dropped into window: ' + file.path);
                window.spl.setPayloadManually(file.path);
                return;
            }
        }
    }

    showToast(window.spl.getLocaleString('payload_not_in_drop'), 'error');
}

// 1
window.addEventListener('dragenter', function(e) {
    showDropZone();
});

// 2
//dropZone.addEventListener('dragenter', allowDrag);

// 3
dropZone.addEventListener('dragleave', function(e) {
    hideDropZone();
});

// 4
dropZone.addEventListener('drop', handleDrop);