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
 
// https://github.com/apache/cordova-plugin-device-motion/

var cordova = require('cordova');

var accelX,
    accelY,
    accelZ;

// report interval in milliseconds
var ACCELEROMETER_REPORT_INTERVAL = 250;

// TODO: complete
var orientations = [
    {
        name: 'Portrait Standing',
        accel: {x: 0, y: -1, z: 0}
    },
    {
        name: 'Standing2',
        accel: {x: 1, y: 0, z: 1}
    },
];

var accelerometerHandle = null;

function initialize() {
    accelX = document.getElementById('accel-x');
    accelY = document.getElementById('accel-y');
    accelZ = document.getElementById('accel-z');
    
    var accelXLabel = document.getElementById('accel-x-label'),
        accelYLabel = document.getElementById('accel-y-label'),
        accelZLabel = document.getElementById('accel-z-label');
        
    accelX.onchange = function() {
       accelXLabel.textContent = parseInt(accelX.value)/1000;
    };
    
    accelY.onchange = function() {
       accelYLabel.textContent = parseInt(accelY.value)/1000;
    };
    
    accelZ.onchange = function() {
       accelZLabel.textContent = parseInt(accelZ.value)/1000;
    };
    
    var orientationsList = document.getElementById('accel-device-orientations');
    orientationsList.addEventListener('change', handleOrientationChange);

    orientations.forEach(function (orientation) {
        var option = document.createElement('option');
        option.value = orientation.accel;
        var caption = document.createTextNode(orientation.name);
        option.appendChild(caption);
        orientationsList.appendChild(option);
    });

    orientationsList.value = 'Portrait Standing';
    handleOrientationChange();
    
}

function handleOrientationChange() {
     var orientationsList = document.getElementById('accel-device-orientations');
     var accel = orientations[orientationsList.selectedIndex].accel;

     accelX.value = accel.x * 1000;
     accelX.onchange();
     
     accelY.value = accel.y * 1000;
     accelY.onchange();
     
     accelZ.value = accel.z * 1000;
     accelZ.onchange();
}

function getCurrentAcceleration() {
     return {
         x: parseInt(accelX.value)/1000,
         y: parseInt(accelY.value)/1000,
         z: parseInt(accelZ.value)/1000,
         timestamp: (new Date()).getTime()
     }
}

function start(win, lose) {
    accelerometerHandle = setInterval(function() {
         win(getCurrentAcceleration());
    }, ACCELEROMETER_REPORT_INTERVAL);
}

function stop(win, lose) {
    if (accelerometerHandle == null) {
        return;
    }
    
    clearInterval(accelerometerHandle);
    accelerometerHandle = null;
}

cordova.registerPluginHandlers({
    'Accelerometer.start': start,
    'Accelerometer.stop': stop,
    });

module.exports = {
    initialize: initialize,
};
