module.exports = function(messages) {
    function initialize() {
        var eventList = document.getElementById('event-list');
        var events = ['deviceready', 'backbutton', 'menubutton', 'pause', 'resume', 'searchbutton', 'online', 'offline'];
        events.forEach(function (event) {
            var option = document.createElement('option');
            option.value = event;
            var caption = document.createTextNode(event);
            option.appendChild(caption);
            eventList.appendChild(option);
        });
        document.getElementById('event-fire').addEventListener('click', function () {
            var eventList = document.getElementById('event-list');
            var option = eventList.options[eventList.selectedIndex];
            messages.emit('event', option.value, function (result, err) {
                if (err) {
                    console.log('Firing event failed: ' + err);
                } else {
                    console.log('Fired event: ' + result);
                }
            });
        });
    }

    return {
        initialize: initialize
    };
};
