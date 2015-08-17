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

var cordova = require('cordova');

module.exports = function (messages) {
    var filenameInput = document.getElementById('camera-filename');
    var dialogFilenameInput = document.getElementById('camera-dialog-filename');

    messages.register('takePicture', function (args, callback) {
        if (document.getElementById('camera-host').checked) {
            window.alert('Not supported');
        } else if (document.getElementById('camera-prompt').checked) {
            var img = document.getElementById('camera-dialog-image');

            // Not we use .onclick etc here rather than addEventListener() to ensure we replace any existing handler
            // with one that uses the appropriate values from the current closure.
            document.getElementById('camera-dialog-choose-filename').onclick = function () {
                dialogFilenameInput.input.click();
            };
            document.getElementById('camera-dialog-use-image').onclick = function () {
                cordova.hideDialog('camera-choose-image');
                createArrayBuffer(dialogFilenameInput, callback);
            };
            document.getElementById('camera-dialog-cancel').onclick = function () {
                cordova.hideDialog('camera-choose-image');
                callback(null, null);
            };
            dialogFilenameInput.onchange = function () {
                img.src = URL.createObjectURL(dialogFilenameInput.files[0]);
                img.style.display = '';
                document.getElementById('camera-dialog-use-image').style.display = '';
            };

            cordova.showDialog('camera-choose-image');
        } else if (document.getElementById('camera-sample').checked) {
            window.alert('Not supported');
        } else if (document.getElementById('camera-file').checked) {
            createArrayBuffer(filenameInput, callback);
        }
    });

    function createArrayBuffer(input, callback) {
        var blob = input.files[0];
        var reader = new FileReader();
        reader.onloadend = function () {
            callback(reader.error, {data: reader.result, type: blob.type});
        };
        reader.readAsArrayBuffer(blob);
    }

    return {
        initialize: function () {
            document.getElementById('camera-choose-filename').addEventListener('click', function () {
                filenameInput.input.click();
            });

            filenameInput.addEventListener('change', function () {
                var url = URL.createObjectURL(filenameInput.files[0]);
                var img = document.getElementById('camera-img');
                img.src = url;
                img.style.display = '';
            });
        }
    };
};