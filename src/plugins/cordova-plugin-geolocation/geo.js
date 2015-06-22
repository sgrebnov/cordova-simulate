var db = require('db'),
    exception = require('exception'),
    event = require('event'),
    utils = require('utils'),
    _positionInfo = {
        'latitude': 43.465187,
        'longitude': -80.522372,
        'altitude': 100,
        'accuracy': 150,
        'altitudeAccuracy': 80,
        'heading': 0,
        'speed': 0,
        'cellID': 321654
    };

var self = module.exports = {
    updatePositionInfo: function (newPositionInfo, delay, timeout) {
        if (!_validatePositionInfo(newPositionInfo)) {
            exception.raise(exception.types.Geo, 'invalid positionInfo object');
        }

        _positionInfo = utils.copy(newPositionInfo);
        _positionInfo.timeStamp = new Date();

        self.delay = delay || 0;
        self.timeout = timeout;

        db.saveObject('geosettings', _serialize({
            position: _positionInfo,
            delay: self.delay,
            timeout: self.timeout
        }));

        event.trigger('PositionInfoUpdatedEvent', [_positionInfo]);
    }
};
