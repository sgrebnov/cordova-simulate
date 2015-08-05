var cordova = require('cordova'),
    savedSims = require('./saved-sims'),
    event = require('event');

module.exports = {
    initialize: function () {
        var sims = savedSims.sims;

        var execList = document.getElementById('exec-list');
        execList.addEventListener('itemremoved', function (e) {
            savedSims.removeSim(e.detail.itemIndex);
            addEmptyItem();
        });

        event.on('saved-sim-added', function (sim) {
            removeEmptyItem();
            execList.addItem(cordovaItemFromSim(sim));
        });

        if (sims && sims.length) {
            sims.forEach(function (sim) {
                execList.addItem(cordovaItemFromSim(sim));
            });
        } else {
            // Create a "No values saved" item
            addEmptyItem();
        }
    }
};

function cordovaItemFromSim(sim) {
    var labeledValue = new CordovaLabeledValue();
    labeledValue.label = sim.service + '.' + sim.action;

    var value = sim.value;
    if (typeof value === 'object') {
        try {
            value = JSON.stringify(value);
        } catch (e) {
        }
    }

    labeledValue.value = value;
    var cordovaItem = new CordovaItem();
    cordovaItem.appendChild(labeledValue);
    return cordovaItem;
}

function createEmptyItem() {
    var labeledValue = new CordovaLabeledValue();
    labeledValue.label = 'No values saved';
    labeledValue.value = '';
    var cordovaItem = new CordovaItem();
    cordovaItem.appendChild(labeledValue);
    return cordovaItem;
}

var hasEmptyItem = false;
function addEmptyItem() {
    if (hasEmptyItem) {
        return;
    }

    var execList = document.getElementById('exec-list');
    var sims = savedSims.sims;
    if (sims.length === 0) {
        execList.addItem(createEmptyItem());
        hasEmptyItem = true;
    }
}

function removeEmptyItem() {
    if (!hasEmptyItem) {
        return;
    }

    var execList = document.getElementById('exec-list');
    execList.removeItem(0);
    hasEmptyItem = false;
}

function handleUnknownExecCall(success, fail, service, action, args) {
    // If we have a saved sim for this service.action, use that
    var savedSim = savedSims.findSavedSim(service, action);
    if (savedSim) {
        if (savedSim.success) {
            success(savedSim.value);
        } else {
            fail(savedSim.value);
        }
        return;
    }

    // Otherwise show the dialog
    var successButton = document.getElementById('exec-success');
    var failureButton = document.getElementById('exec-failure');
    var resultField = document.getElementById('exec-response');

    document.getElementById('exec-error').style.display = 'none';
    document.getElementById('exec-service').textContent = service;
    document.getElementById('exec-action').textContent = action;

    function handleSuccess() {
        exec(success, true);
    }

    function handleFailure() {
        exec(fail);
    }

    function exec(func, isSuccess) {
        var result = resultField.value;

        try {
            result = result && JSON.parse(result);
        } catch (e) {
            document.getElementById('exec-error').style.display = '';
            document.getElementById('exec-parse-error').textContent = e.toString();
            return;
        }
        cordova.hideDialog('exec-dialog');

        if (document.getElementById('exec-persist').checked) {
            savedSims.addSim({service: service, action: action, args: args, value: result, success: isSuccess});
        }

        func.apply(null, result ? [result] : []);
    }

    // Do this each time to capture the values from the current closure. Also, use this approach rather than
    // addEventListener(), as it can prove difficult to remove the event listener.
    successButton.onclick = handleSuccess;
    failureButton.onclick = handleFailure;

    resultField.value = '';
    cordova.showDialog('exec-dialog');
}

cordova.registerPluginHandlers({'*.*': handleUnknownExecCall});
