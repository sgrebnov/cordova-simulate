module.exports = function (messages) {
    messages.on('vibrate', function (message, event, callback) {
        if (window.navigator && window.navigator.vibrate) {
            event = parseInt(event, 10);
            navigator.vibrate(event);
            callback(event);
        } else {
            callback(null, 'navigator.vibrate is not defined');
        }
    });

    messages.on('cancelVibration', function (message, event, callback) {
        if (window.navigator && window.navigator.vibrate) {
            navigator.vibrate(event);
            callback(event);
        } else {
            callback(null, 'navigator.vibrate is not defined');
        }
    });
};