var cordova = require('cordova'),
    saveSims = require('saved-sims');

var eventsBound = false;
function handleUnknownExecCall(success, fail, service, action, args) {
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
        cordova.hideDialog('generic-exec');

        if (document.getElementById('exec-persist').checked) {
            saveSims.addSim({service: service, action: action, args: args, value: result, success: isSuccess});
        }

        func.apply(null, result ? [result] : []);
    }

    if (!eventsBound) {
        successButton.addEventListener('click', handleSuccess);
        failureButton.addEventListener('click', handleFailure);
        eventsBound = true;
    }

    resultField.value = '';
    cordova.showDialog('generic-exec');
}


cordova.registerPluginHandlers({'Generic.generic': handleUnknownExecCall});
