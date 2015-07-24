function Messages(pluginId, socket) {
    this.pluginId = pluginId;
    this.socket = socket;
    this.events = {};

    var that = this;
    socket.on('plugin-message', function (data, callback) {
        if (data.pluginId === pluginId) {
            notify.call(that, data.message, data.data, callback);
        }
    });
}

function notify(message, data, callback) {
    // Notifies local listeners of a message
    var handlers = this.events && this.events[message];
    if (handlers) {
        handlers.forEach(function (handler) {
            handler.call(this, message, data, callback);
        });
    }
}

Messages.prototype = {
    emit: function (message, data, callback) {
        // Pass the message across the socket
        this.socket.emit('plugin-message', {
            pluginId: this.pluginId,
            message: message,
            data: data
        }, callback);

        // Notify any local listeners
        notify.call(this, message, data, callback);
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

module.exports = Messages;
