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

var axisX,
    axisY,
    axisZ,
    alpha,
    beta,
    gamma;

var _mouseDown,
    _shiftKeyDown = false,
    _offsets,
    _oldX,
    _oldY,
    _oldAlphaX,
    _deltaAlpha,
    _alpha,
    _beta,
    _gamma,
    _shape =
        //
        // The front side
        //
        // x, y, z      x, y, z         x, y, z
        // for some strange reason for y -100 is top, 100 is bottom
        '-30,30,10,     30,30,10,       30,60,10,       100,100,100,-1,0;' + // top left, top right, bottom right - of the right triangle
        '-30,30,10,     30,60,10,       -30,60,10,      100,100,100,-1,0;' + // top left, right bottom, left bottom - of the left triangle
        // front side 'the phone display'
        '-20,-50,11,    20,-50,11,      20,20,11,       100,100,100,-1,0;' +
        '-20,-50,11,    20,20,11,       -20,20,11,      100,100,100,-1,0;' +
        // below the display
        '-30,30,10,     30,20,10,       30,30,10,       0,0,0,-1,0;' +
        '-30,30,10,     -30,20,10,      30,20,10,       0,0,0,-1,0;' +
        // above the display
        '-30,-60,10,    30,-60,10,      30,-50,10,      0,0,0,-1,0;' +
        '-30,-60,10,    30,-50,10,      -30,-50,10,     0,0,0,-1,0;' +
        // left of the display
        '-30,-50,10,    -20,-50,10,     -20,20,10,      0,0,0,-1,0;' +
        '-30,-50,10,    -20,20,10,      -30,20,10,      0,0,0,-1,0;' +
        // right of the display
        '20,-50,10,     30,-50,10,      30,20,10,       0,0,0,-1,0;' +
        '20,-50,10,     30,20,10,       20,20,10,       0,0,0,-1,0;' +


        // back side, opposite side to the above one
        '-30,-60,-10,   30,60,-10,      30,-60,-10,     0,0,0,-1,0;' +
        '-30,-60,-10,   -30,60,-10,     30,60,-10,      0,00,-1,0;' +
        // right side
        '30,-60,-10,    30,60,-10,      30,60,10,       50,50,80,-1,0;' +
        '30,-60,-10,    30,60,10,       30,-60,10,      50,50,80,-1,0;' +
        // left side
        '-30,-60,-10,   -30,60,10,      -30,60,-10,     50,50,80,-1,0;' +
        '-30,-60,-10,   -30,-60,10,     -30,60,10,      50,50,80,-1,0;' +

        // top
        '30,-60,-10,    -30,-60,10, -30,-60,-10,    50,80,50,-1,0;' +
        '30,-60,-10,    30,-60,10,      -30,-60,10, 50,80,50,-1,0;' +
        // bottom
        '30,60,-10, -30,60,-10,     -30,60,10,      80,50,50,-1,0;' +
        '30,60,-10, -30,60,10,      30,60,10,       80,50,50,-1,0';


// report interval in milliseconds
var ACCELEROMETER_REPORT_INTERVAL = 50;

var gConstant = 9.81;

var recordedGestures = [
    {
        name: 'Shake',
        fn: shake
    }
];

var accelerometerHandle = null;

function initialize() {
    axisX = document.getElementById('accel-x-label');
    axisY = document.getElementById('accel-y-label');
    axisZ = document.getElementById('accel-z-label');
    alpha = document.getElementById('accel-alpha-label');
    beta = document.getElementById('accel-beta-label');
    gamma = document.getElementById('accel-gamma-label');

    createCanvas();

    setToDefaultPosition();

    var recordedGesturesList = document.getElementById('accel-recorded-data');
    recordedGestures.forEach(function (gesture) {
        var option = document.createElement('option');
        option.appendChild( document.createTextNode(gesture.name));
        recordedGesturesList.appendChild(option);
    });

    document.getElementById('accel-play-recorded').addEventListener('click', function() {
        var list = document.getElementById('accel-recorded-data');
        recordedGestures[list.selectedIndex].fn();
    });
}

function start(win, lose) {
    accelerometerHandle = setInterval(function() {
        win(getCurrentAcceleration());
    }, ACCELEROMETER_REPORT_INTERVAL);
}

function stop(win, lose) {
    if (accelerometerHandle === null) {
        return;
    }

    clearInterval(accelerometerHandle);
    accelerometerHandle = null;
}

cordova.registerPluginHandlers({
    'Accelerometer.start': start,
    'Accelerometer.stop': stop,
    'Accelerometer.getCurrentAcceleration': getCurrentAccelerationHandle
    });

function setToDefaultPosition() {
     var accel = {x: 0, y: 0, z: -1, alpha: 0, beta: 0, gamma: 0 };

     axisX.textContent = (accel.x * gConstant).toFixed(2);
     axisY.textContent = (accel.y * gConstant).toFixed(2);
     axisZ.textContent = (accel.z * gConstant).toFixed(2);

    _alpha = accel.alpha;
    _beta = accel.beta;
    _gamma = accel.gamma;
    _deltaAlpha = 360;

    _oldX = 0;
    _oldY = 0;
    _oldAlphaX = 0;
    _offsets = {
        x: accel.x,
        y: accel.y,
        z: accel.z,
    };

    updateCanvas(0,0);
}

function getCurrentAcceleration () {
    return {
         x: parseFloat(axisX.textContent),
         y: parseFloat(axisY.textContent),
         z: parseFloat(axisZ.textContent),
         timestamp: (new Date()).getTime()
    };
}

function getCurrentAccelerationHandle (win, lose) {
    win(getCurrentAcceleration());
}

function shake() {
    var id,
        count = 1,
        stopCount = 2500 / ACCELEROMETER_REPORT_INTERVAL,
        oldX = axisX.textContent,
        defaultXAxis = 150,
        defaultYAxis = 100;

    id = setInterval(function () {
        var freq = 1,
            amp = 20,
            value = Math.round(amp * Math.sin(freq * count * (180 / Math.PI)) * 100) / 100;
    
        if (count > stopCount) {
            updateCanvasCenter(defaultXAxis, defaultYAxis);
            axisX.textContent = oldX;
            clearInterval(id);
            return;
        }

        axisX.textContent = (value * gConstant).toFixed(2);
        // shake effect
        updateCanvasCenter(Math.random() * (155 - 145) + 145, defaultYAxis);
        count++;
    }, ACCELEROMETER_REPORT_INTERVAL);
 }

module.exports = {
    initialize: initialize,
};

function updateCanvasCenter(xAxis, yAxis) {
    ThreeDee.setCenter(xAxis, yAxis);
    Draw.initialize(document.getElementById('accelerometer-canvas'));
    Draw.clear(0, 0, 480, 300);
    Draw.drawScene(ThreeDee.getTranslation(), 3);
}

function updateCanvas(a, b, g) {
    ThreeDee.loadMesh(_shape);
    g = g || 0;
    ThreeDee.rotate(0, g, 0);
    ThreeDee.rotate(b, 0, a);
    ThreeDee.backface();
    ThreeDee.shade();
    ThreeDee.zSort();
    Draw.initialize(document.getElementById('accelerometer-canvas'));
    Draw.clear(0, 0, 480, 300);
    Draw.drawScene(ThreeDee.getTranslation(), 3);
}

function createCanvas() {
    var node = document.getElementById('accelerometer-canvas'),
        cosX, sinX, cosY, sinY;

    ThreeDee.setCenter(150, 100);
    ThreeDee.setLight(-300, -300, 800);

    node.addEventListener('mousemove', function (e) {
        if (_mouseDown && !_shiftKeyDown) {
            _offsets.x = (_offsets.x + _oldX - e.offsetX) % 360;
            _offsets.y = (_offsets.y + _oldY - e.offsetY) % 360;

            _alpha = _alpha || 0;

            // enforce gamma in [-90,90] as per w3c spec
            _gamma = -_offsets.x;
            if (_gamma < -90) {
                _gamma = -90;
            }
            if (_gamma > 90) {
                _gamma = 90;
            }

            // enforce beta in [-180,180] as per w3c spec
            _beta = -_offsets.y % 360;
            if (_beta < -180) {
                _beta += 360;
            }
            else if (_beta >= 180) {
                _beta -= 360;
            }

            cosX = Math.cos((_gamma) * (Math.PI / 180));
            sinX = Math.sin((_gamma) * (Math.PI / 180));
            cosY = Math.cos((_beta) * (Math.PI / 180));
            sinY = Math.sin((_beta) * (Math.PI / 180));

            axisX.textContent = (cosY * sinX * gConstant).toFixed(2);
            axisY.textContent = (-sinY * gConstant).toFixed(2);
            axisZ.textContent = (-cosY * cosX * gConstant).toFixed(2);
            beta.textContent = _beta;
            gamma.textContent = _gamma;


        } else if (_mouseDown && _shiftKeyDown) {
            _deltaAlpha = (_deltaAlpha - (_oldAlphaX - e.offsetX) * 2.5) % 360;
            _alpha = (360 - _deltaAlpha) % 360;

            alpha.textContent = _alpha;
        }

        _oldX = e.offsetX;
        _oldY = e.offsetY;
        _oldAlphaX = e.offsetX;

        updateCanvas(_deltaAlpha, -_beta, _gamma);
    });

    node.addEventListener('mousedown', function (e) {
        _oldX = e.offsetX;
        _oldY = e.offsetY;
        _mouseDown = true;
    });

    node.addEventListener('mouseup', function () {
        _mouseDown = false;
    });

    document.addEventListener('mouseup', function () {
        //Catch mouseup events that fire when outside canvas bounds
        _mouseDown = false;
    });

    document.addEventListener('keydown', function (e) {
        if (e.keyCode === 16) { // Shift Key
            _oldAlphaX = _oldX;
            _shiftKeyDown = true;
        }
    });

    document.addEventListener('keyup', function (e) {
        if (e.keyCode === 16) { // Shift Key
            _shiftKeyDown = false;
        }
    });

    return node;
}
