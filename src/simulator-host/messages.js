var Socket = require('./socket');

function Messages(pluginId) {
    this.pluginId = pluginId;
    this.events = {};

    var that = this;
    Socket.socket.on('plugin-message', function (data, callback) {
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
        Socket.socket.emit('plugin-message', {
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

module.exports = Messages;
