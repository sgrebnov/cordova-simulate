var _success, _fail;

function handleTakePicture(success, fail, service, action, args) {
    _success = success;
    _fail = fail;
    if (document.getElementById('camera-host').checked) {
        window.alert('Not supported');
    } else if (document.getElementById('camera-prompt').checked) {
        cordova.showDialog('camera-choose-image');
    } else if (document.getElementById('camera-sample').checked) {
        window.alert('Not supported');
    } else if (document.getElementById('camera-file').checked) {
        var url = URL.createObjectURL(document.getElementById('camera-filename').files[0]);
        success(url);
    }
}

function updateImage() {
    var url = URL.createObjectURL(document.getElementById('camera-filename').files[0]);
    var img = document.getElementById('img');
    img.src = url;
    img.style.display = null;
}

function updateDialogImage() {
    var url = URL.createObjectURL(document.getElementById('camera-dialog-filename').files[0]);
    var img = document.getElementById('dialog-image');
    img.src = url;
    img.style.display = null;
    document.getElementById('camera-use-image').style.display = 'initial';
}

function cancelDialog() {
    cordova.hideDialog('camera-choose-image');
    _success(null);
}

function useImage() {
    cordova.hideDialog('camera-choose-image');
    var url = document.getElementById('dialog-image').src;
    _success(url);
}

cordova.registerPluginHandlers({'Camera.takePicture': handleTakePicture});

module.exports = {
    updateImage: updateImage,
    updateDialogImage: updateDialogImage,
    cancelDialog: cancelDialog,
    useImage: useImage
};
