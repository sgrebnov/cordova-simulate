var cordova = require('cordova');

var socket;

module.exports.initialize = function () {
    console.log('socket.initialize()');

    socket = io();
    module.exports.socket = socket;

    socket.emit('register-simulation-host');
    socket.on('exec', function (data) {
        console.log('Exec was called with message: ' + data);

        if (!data) {
            throw 'Exec called on simulation host without exec info';
        }

        var index = data.index;
        if (typeof index !== 'number') {
            throw 'Exec called on simulation host without an index specified';
        }

        var success = getSuccess(index);
        var failure = getFailure(index);

        var service = data.service;
        if (!service) {
            throw 'Exec called on simulation host without a service specified';
        }

        var action = data.action;
        if (!action) {
            throw 'Exec called on simulation host without an action specified';
        }

        var handlerId = service + '.' + action;
        console.log('cordova.pluginHandlers');
        console.log(cordova.pluginHandlers);
        var handler = cordova.pluginHandlers[handlerId];

        if (!handler) {
            console.log('No simulation plugin handler for ' + handlerId);
        } else {
            handler(success, failure, service, action, data.args);
        }
    });
}

function getSuccess(index) {
    return function (result) {
        console.log('Success callback for index: ' + index + '; result: ' + result);
        var data = {index: index, result: result};
        socket.emit('exec-success', data);
    };
}

function getFailure(index) {
    return function (error) {
        console.log('Failure callback for index: ' + index + '; error: ' + error);
        var data = {index: index, error: error};
        socket.emit('exec-failure', data);
    };
}
