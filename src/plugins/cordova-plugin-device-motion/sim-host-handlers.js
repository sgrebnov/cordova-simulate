/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * 'License'); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */

var deviceMotion = require('cordova-plugin-device-motion');
var accelerometerHandle = null;

module.exports = {
    'Accelerometer': {
        start: function (win, lose) {
            accelerometerHandle = setInterval(function() {
                win(getCurrentAcceleration());
            }, deviceMotion.ACCELEROMETER_REPORT_INTERVAL);
        },
        stop: function (win, lose) {
            if (accelerometerHandle === null) {
                return;
            }

            clearInterval(accelerometerHandle);
            accelerometerHandle = null;
        },
        getCurrentAcceleration: function (win, lose) {
            win(getCurrentAcceleration());
        }
    }
};

function getCurrentAcceleration () {
    return {
        x: parseFloat(deviceMotion.x),
        y: parseFloat(deviceMotion.y),
        z: parseFloat(deviceMotion.z),
        timestamp: (new Date()).getTime()
    };
}
