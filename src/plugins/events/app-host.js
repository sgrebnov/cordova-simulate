module.exports = function(messages) {
    messages.on('event', function (message, event, callback) {
        if (!window.cordova) {
            callback(null, 'You must have cordova.js included in your projects, to be able to trigger events');
        } else {
            try {
                window.cordova.fireDocumentEvent(event);
                callback(event);
            } catch (e) {
                callback(null, e);
            }
        }
    });
};
