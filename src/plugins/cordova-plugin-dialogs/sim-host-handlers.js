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
 
// https://github.com/apache/cordova-plugin-dialogs/

module.exports = function (messages) {
    function alert (success, fail, args) {
        messages.call('alert', args).then(function () {
            success();
        }, function (err) {
            fail(err);
        });
    }

    function confirm (success, fail, args) {
        messages.call('confirm', args).then(function (result) {
            success(result);
        }, function (err) {
            fail(err);
        });
    }

    function prompt (success, fail, args) {
        messages.call('prompt', args).then(function (result) {
            success(result);
        }, function (err) {
            fail(err);
        });
    }

    function beep (success, fail, args) {
        var times = args[0];
        messages.call('beep', times).then(function () {
            success();
        }, function (err) {
            fail(err);
        });
    }

    return {
        Notification: {
            alert: alert,
            confirm: confirm,
            prompt: prompt,
            beep: beep,
        }
    };
};
