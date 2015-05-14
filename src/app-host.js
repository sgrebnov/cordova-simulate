(function () {
    var cordova;
    var oldExec;
    var socket = io();
    var nextExecCacheIndex = 0;
    var execCache = {};

    function setCordova(originalCordova) {
        if (cordova) {
            return;
        }

        cordova = originalCordova;

        oldExec = cordova.require('cordova/exec');
        cordova.define.remove('cordova/exec');
        cordova.define('cordova/exec', function (require, exports, module) {
            module.exports = exec;
        });
    }

    function getCordova() {
        return cordova;
    }

    socket.on('exec-success', function (data) {
        console.log('exec-success: ' + data);
        var execCacheInfo = execCache[data.index];
        execCacheInfo.success(data.result);
    });

    socket.on('exec-failure', function (data) {
        console.log('exec-failure: ' + data);
        var execCacheInfo = execCache[data.index];
        execCacheInfo.fail(data.error);
    });

    socket.emit('register-app-host');

    function exec(success, fail, service, action, args) {
        var execIndex = nextExecCacheIndex++;
        execCache[execIndex] = {index: execIndex, success: success, fail: fail};
        socket.emit('exec', {index: execIndex, service: service, action: action, args: args});
    }

    // Setup for cordova.exec patching
    Object.defineProperty(window, 'cordova', {
        set: setCordova,
        get: getCordova
    });
})();


