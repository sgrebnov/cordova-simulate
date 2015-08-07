var pluginDialogs  = {};

var currentDialogId = null;

module.exports.pluginDialogs = pluginDialogs;

function showDialog(dialogId) {
    var dialog = pluginDialogs[dialogId];
    if (!dialog) {
        throw 'No dialog defined with id ' + dialogId;
    }

    // We don't currently allow nesting dialogs, so close any existing dialog
    if (currentDialogId) {
        hideDialog(currentDialogId);
    }

    currentDialogId = dialogId;
    document.getElementById('popup-window').style.display = null;
    dialog.style.display = null;
}
module.exports.showDialog = showDialog;

function hideDialog(dialogId) {
    if (dialogId !== currentDialogId) {
        throw 'Trying to hide a dialog that isn\'t currently showing: ' + dialogId;
    }

    var dialog = pluginDialogs[dialogId];
    if (!dialog) {
        throw 'No dialog defined with id ' + dialogId;
    }

    currentDialogId = null;
    document.getElementById('popup-window').style.display = 'none';
    dialog.style.display = 'none';
}
module.exports.hideDialog = hideDialog;
