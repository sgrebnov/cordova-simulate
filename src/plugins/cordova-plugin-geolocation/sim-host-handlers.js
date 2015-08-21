/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */

module.exports = function (messages) {
    var geo = require('./geo-model'),
        utils = require('utils'),
        PositionError = require('./PositionError'),
        _watches = {};

    function _getCurrentPosition(win, fail) {
        var delay = (geo.delay || 0) * 1000;
        window.setTimeout(function () {
            if (geo.timeout) {
                if (fail) {
                    fail(new PositionError(PositionError.TIMEOUT, "Position retrieval timed out."));
                }
            } else {
                win(geo.getPositionInfo())
            }
        }, delay);
    }

    messages.on('position-info-updated', function (message, pi) {
        utils.forEach(_watches, function (watch) {
            try {
                _getCurrentPosition(watch.win, watch.fail);
            } catch (e) {
                console.log(e);
            }
        });
    });

    return {
        Geolocation: {
            getLocation: function (success, error) {
                _getCurrentPosition(success, error);
            },
            addWatch: function (success, error, args) {
                _watches[args[0]] = {
                    win: success,
                    fail: error
                };
                _getCurrentPosition(success, error);
            },
            clearWatch: function (success, error, args) {
                delete _watches[args[0]];
                if (success && typeof (success) === 'function') {
                    success();
                }
            }
        }
    };
};
