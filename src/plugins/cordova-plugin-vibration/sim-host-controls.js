var cordova = require('cordova');

function handleVibration(success, fail, service, action, args) {
    console.log('"' + service + '" "' + action + '" called with args "' + args + '"');
    success('Vibrating');
}

function handleCancelVibration(success, fail, service, action, args) {
    console.log('"' + service + '" "' + action + '" called with args "' + args + '"');
    success('Stopped vibration');
}

cordova.registerPluginHandlers({'Vibration.vibrate': handleVibration});
cordova.registerPluginHandlers({'Vibration.cancelVibration': handleCancelVibration});

module.exports = function (messages) {
    function initialize() {
        var timeToVibrateElement = document.getElementById('time-to-vibrate');
        // Default value
        timeToVibrateElement.value = 5000;
    }

    function checkForInt (data) {
        if (data != parseInt(data, 10)) {
            throw new Error('Time must be integer value');
        }
    }

    function vibrate () {
        var timeToVibrate = document.getElementById('time-to-vibrate').value;
        checkForInt(timeToVibrate);
        messages.emit('vibrate', timeToVibrate, function (result, err) {
            if (err) {
                window.alert('Vibration failed: ' + err);
            } else {
                window.alert('Vibrating for ' + timeToVibrate + ' seconds');
            }
        });
    }

    function cancelVibration () {
        messages.emit('cancelVibration', 'cancelVibration', function (result, err) {
            if (err) {
                window.alert('Cancel vibration failed: ' + err);
            } else {
                window.alert('Cancelling vibration');
            }
        });
    }

    return {
        initialize: initialize,
        vibrate: vibrate,
        cancelVibration: cancelVibration
    };
};