var cordova;
var oldExec;
var socket = io();
var nextExecCacheIndex = 0;
var execCache = {};
var pluginHandlers = {};

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
    // If we have a local handler, call that. Otherwise pass it to the simulation host.
    var handler = pluginHandlers[service + '.' + action];
    if (handler) {
        handler(success, fail, service, action, args);
    } else {
        var execIndex = nextExecCacheIndex++;
        execCache[execIndex] = {index: execIndex, success: success, fail: fail};
        socket.emit('exec', {index: execIndex, service: service, action: action, args: args});
    }
}

// Setup for cordova.exec patching
Object.defineProperty(window, 'cordova', {
    set: setCordova,
    get: getCordova
});

function Messages(pluginId) {
    this.pluginId = pluginId;
    this.events = {};

    var that = this;
    socket.on('plugin-message', function (data, callback) {
        if (data.pluginId !== pluginId || !that.events) {
            return;
        }

        var handlers = that.events[data.message];
        if (!handlers) {
            return;
        }

        handlers.forEach(function (handler) {
            handler.call(that, data.message, data.data, callback);
        });
    });
}

Messages.prototype = {
    emit: function (message, data, callback) {
        socket.emit('plugin-message', {
            pluginId: this.pluginId,
            message: message,
            data: data
        }, callback);
    },

    on: function (message, handler) {
        if (!this.events[message]) {
            this.events[message] = [handler];
        } else {
            this.events[message].push(handler);
        }
        return this;
    },

    off: function (message, handler) {
        var handlers = this.events[message];
        if (!handlers) {
            return this;
        }

        var pos = handlers.indexOf(handler);
        while (pos > -1) {
            handlers.splice(pos, 1);
            pos = handlers.indexOf(handler);
        }
    }
};

function registerPluginHandlers(handlers) {
    for (var handlerId in handlers) {
        if (handlers.hasOwnProperty(handlerId)) {
            pluginHandlers[handlerId] = handlers[handlerId];
        }
    }
}

// Details of each plugin that has app-host code is injected when this file is served.
var plugins = {
    /** PLUGINS **/
};

Object.keys(plugins).forEach(function (pluginId) {
    var pluginInfo = plugins[pluginId];
    if (typeof pluginInfo === 'function') {
        pluginInfo = pluginInfo(new Messages(pluginId));
        plugins[pluginId] = pluginInfo;
    }

    if (pluginInfo && pluginInfo.pluginHandlers) {
        registerPluginHandlers(pluginInfo.pluginHandlers);
    }
});
