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

module.exports = function (messages) {
    function handleVibration(success, fail, args) {
        console.log('"' + service + '" "' + action + '" called with args "' + args + '"');
        var ms = args[0];
        messages.call('vibrate', ms).then(function () {
            console.log('Vibrating for ' + ms + ' milliseconds');
        }, function (err) {
            throw new Error('Vibration failed: ' + err);
        });
    }

    function handleVibrationWithPattern(success, fail, args) {
        console.log('"' + service + '" "' + action + '" called with args "' + args + '"');
        messages.call('vibrateWithPattern', args).then(function () {
            console.log('Vibrating with pattern - ' +args);
        }, function (err) {
            throw new Error('Vibration with pattern failed: ' + err);
        });
    }

    function handleCancelVibration(success, fail, args) {
        console.log('"' + service + '" "' + action + '" called');
        messages.call('cancelVibration', 'cancelVibration').then(function () {
            console.log('Cancelling vibration');
        }, function (err) {
            throw new Error('Cancel vibration failed: ' + err);
        });
    }

    return {
        'Vibration': {
            'vibrate': handleVibration,
            'vibrateWithPattern': handleVibrationWithPattern,
            'cancelVibration': handleCancelVibration
        }
    };
};
