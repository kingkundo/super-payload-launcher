var currentStep = 1;
var lastDeviceStatus = false;
var initialised = false;
var disableAllInput = false;

interface Window {
    spl: any;
}

declare var Swal: any;

window.addEventListener('load', function () {
    initialised = false;
    writeTranslatedText();
    document.getElementById('i3')!.hidden = window.spl.payloadSendAutomatically();
    refreshGUI();
    window.spl.searchForDevice();
    startDeviceAutosearch();
    doWindowsSwitchDriverPrompt();
});

function writeTranslatedText() {
    function updateInnerHTML(elementId: string, key: string, innertag = '', outertag = '') {
        document.getElementById(elementId)!.innerHTML = innertag + window.spl.getLocaleString(key) + outertag;
    }

    const appTitle = window.spl.getLocaleString('app_title');
    document.title = appTitle;
    document.getElementById('title')!.innerHTML = appTitle;

    updateInnerHTML('step_one_title', 'step_one_title');
    updateInnerHTML('step_one_desc', 'step_one_desc');
    updateInnerHTML('step_one_secondary_desc', 'step_one_sec_desc', '<b>', '</b>');
    updateInnerHTML('step_two_title', 'step_two_title');
    updateInnerHTML('favorite_payload_desc', 'favorite_payload_desc');
    updateInnerHTML('drag_drop_payload_desc', 'drag_drop_payload_desc')
    updateInnerHTML('step_three_title', 'step_three_title');
    updateInnerHTML('launch_payload_button', 'launch_payload_button');
}

function startDeviceAutosearch() {
    const interval = setInterval(function () {
        window.spl.searchForDevice();
    }, 1000);
}

window.spl.on('setInitialised', (event: any, init: boolean) => {
    initialised = init;
    refreshGUI();
});

window.spl.on('deviceStatusUpdate', (event: any, connected: boolean) => {
    if (lastDeviceStatus != connected) {
        lastDeviceStatus = connected;
        refreshGUI();
    }
});

function showToast(text: string, icon: string, timeout: number = 5000) {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        background: 'var(--main-background-color)',
        showConfirmButton: false,
        timer: timeout,
        timerProgressBar: true,
        didOpen: (toast: any) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    })

    Toast.fire({
        icon: icon,
        title: '<a class="nouserselect" style="color:var(--title-text-color);">' + text + '</a>',
    });
}

window.spl.on('showToast', (event: any, text: string, icon: string, timeout: number = 5000) => {
    showToast(text, icon, timeout);
});

window.spl.on('disableAllInput', (event: any, disable: boolean) => {
    disableAllInput = disable;
    refreshGUI();
});

window.spl.on('refreshGUI', (event: any) => {
    refreshGUI();
});

window.spl.on('showPayloadLaunchedPrompt', (event: any, success: boolean) => {
    if (success) {
        var title = window.spl.getLocaleString('payload_delivery_success');
    } else {
        var title = window.spl.getLocaleString('payload_delivery_failed');
    }

    Swal.fire({
        title: '<a class="nouserselect" style="color:var(--title-text-color);">' + title + '</a>',
        icon: 'success',
        background: 'var(--main-background-color)',
        confirmButtonText: '<a class="nouserselect" style="color:var(--title-text-color);">' + window.spl.getLocaleString("save_as_favorite") + '</a>',
        showConfirmButton: success,
        showDenyButton: true,
        denyButtonText: '<a class="nouserselect" style="color:var(--text-color);"><b>' + window.spl.getLocaleString("launch_another_payload") + '</b></a>',
        showCancelButton: true,
        cancelButtonText: '<a class="nouserselect" style="color:var(--title-text-color);">' + window.spl.getLocaleString("quit_application") + '</a>',
    }).then((result: any) => {
        if (result.isConfirmed) {
            window.spl.setPayloadAsFavorite();        
        } else if (result.canceled) {
            window.spl.quitApplication();
        } else if (result.isDenied) {
            
        }
    });
});

function refreshGUI() {
    function updateButton(button: HTMLElement, confirm: boolean, text: string = '') {
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
    var deviceStatusProgressDiv = document.getElementById('devicestatusprogressdiv');
    var deviceStatusDiv = document.getElementById('devicestatusdiv');

    var selectFavoritePayloadBtn = document.getElementById('selectFavoritePayloadBtn');
    var selectPayloadFromFileSystemBtn = document.getElementById('selectPayloadFromFileSystemBtn');
    var selectLatestFuseeBtn = document.getElementById('selectLatestFuseeBtn');
    var selectLatestHekateBtn = document.getElementById('selectLatestHekateBtn');

    if (window.spl.doesFavoritePayloadExist()) {
        selectFavoritePayloadBtn!.style.display = '';
    } else {
        selectFavoritePayloadBtn!.style.display = 'none';
    }

    if ((initialised) && (lastDeviceStatus)) {
        updateButton(deviceStatusContainerDiv!, true);
        deviceStatusDiv!.innerHTML = '<div class="nouserselect">' + window.spl.getLocaleString("switch_found") + '</div>';
        deviceStatusProgressDiv!.style.animationPlayState = 'paused';
        deviceStatusProgressDiv!.style.backgroundColor = 'var(--device-found-color)';
        //deviceProgressDiv!.style.display = 'none';
        currentStep = 2;
    } else {
        updateButton(deviceStatusContainerDiv!, false);
        deviceStatusDiv!.innerHTML = '<div class="nouserselect">' + window.spl.getLocaleString("searching_for_switch") + '</div>';
        deviceStatusProgressDiv!.style.animationPlayState = 'running';
        deviceStatusProgressDiv!.style.backgroundColor = 'var(--searching-device-color)';
        //deviceProgressDiv!.style.display = 'inline';
    }

    const payload = ((initialised) && (window.spl.validatePayload()));
    if (payload) {
        updateButton(selectPayloadFromFileSystemBtn!, true, payload.replace(/^.*[\\\/]/, ''));

        // Only allow step 3 if Switch is connected.
        if (lastDeviceStatus) {
            currentStep = 3;
        }
    } else {
        updateButton(selectFavoritePayloadBtn!, false, window.spl.getLocaleString('open_favorite_payload'))
        updateButton(selectPayloadFromFileSystemBtn!, false, window.spl.getLocaleString('open_local_payload'));
        updateButton(selectLatestFuseeBtn!, false, window.spl.getLocaleString('get_fusee_payload'));
        updateButton(selectLatestHekateBtn!, false, window.spl.getLocaleString('get_hekate_payload'))
    }

    if (disableAllInput) {
        currentStep = -1;
    }

    for (var i = 1; i < 4; i++) {
        var instructionID = 'i' + i.toString();
        var currentInstructionDiv = document.getElementById(instructionID);

        if (i == currentStep) {
            currentInstructionDiv!.classList.remove('fade-out');
            currentInstructionDiv!.classList.add('fade-in');
            currentInstructionDiv!.classList.remove('nouserselect');
            currentInstructionDiv!.style.pointerEvents = 'auto';
        } else {
            currentInstructionDiv!.classList.add('fade-out')
            currentInstructionDiv!.classList.remove('fade-in');
            currentInstructionDiv!.classList.add('nouserselect');
            currentInstructionDiv!.style.pointerEvents = 'none';
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
        }).then((result: any) => {
            if (result.isConfirmed) {
                window.spl.launchDriverInstaller();
                window.spl.on('getDriverInstallerLaunchCode', (event: any, code: string) => {
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

const dropZone = document.getElementById('dropzone');

function showDropZone() {
	dropZone!.style.display = "block";
}
function hideDropZone() {
    dropZone!.style.display = "none";
}

function handleDrop(e: any) {
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
dropZone!.addEventListener('dragleave', function(e) {
    hideDropZone();
});

// 4
dropZone!.addEventListener('drop', handleDrop);