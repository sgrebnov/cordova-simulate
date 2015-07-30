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

var Q = require('q');

module.exports = function (messages) {
    // indicates whether vibration was cancelled
    var vibrationCanceled = false;

    // represents index of the vibration pattern array 
    var currenntVibrationWithPatternIndex;

    // indicates whether we will need to stop vibration effect or not
    var currentVibrationNum = 0;

    messages.on('vibrate', function (message, event, callback) {
        if (!window.navigator && !window.navigator.vibrate) {
            callback(null, 'navigator.vibrate is not defined');
        }

        var ms = parseInt(event, 10);
        var seconds = ms/1000;
        currentVibrationNum++;
        vibrate(ms);
        console.log('vibrating for ' + seconds + ' second(s)');
        callback();
    });

    messages.on('vibrateWithPattern', function (message, event, callback) {
        if (!window.navigator && !window.navigator.vibrate) {
            callback(null, 'navigator.vibrate is not defined');
            return;
        }

        var pattern = event[0];
        currenntVibrationWithPatternIndex = 0;
        console.log('vibrating with pattern ' + pattern);
        currentVibrationNum++;
        vibrateWithPattern(pattern, currentVibrationNum);
        callback();
    });

    messages.on('cancelVibration', function (message, event, callback) {
        if (!window.navigator && !window.navigator.vibrate) {
            callback(null, 'navigator.vibrate is not defined');
            return;
        }

        // cancelVibration is not supported on ios
        if (window.cordova && window.cordova.platformId === 'ios') {
            callback(null, 'Not supported on iOS');
            throw new Error('Not supported on iOS');
        }

        // to stop every other vibration
        currentVibrationNum++;

        // pass 0 to cancel vibration
        vibrate(0);
        vibrationCanceled = true;
        console.log('canceling vibration');
        callback();
    });

    function initializeVibrationSimulation () {
        // Because there is no way for now to add css file to the app host window
        // we adds css this way. This css contains shaking animation in CSS3
        var css = '[cordova-simulate-shake-effect] {   display: inline-block;   position: fixed;   transform-origin: center center;    animation-name: cordova-simulate-shake-effect-slow;   animation-duration: 5s;   animation-iteration-count: infinite;   animation-timing-function: ease-in-out;   animation-delay: 0s;   animation-play-state: running; } @keyframes cordova-simulate-shake-effect-slow {   0% {     transform: translate(0px, 0px) rotate(0deg); }   2% {     transform: translate(-3px, 1px) rotate(-1.5deg); }   4% {     transform: translate(4px, 5px) rotate(1.5deg); }   6% {     transform: translate(4px, 6px) rotate(2.5deg); }   8% {     transform: translate(-7px, 0px) rotate(0.5deg); }   10% {     transform: translate(6px, -5px) rotate(3.5deg); }   12% {     transform: translate(-2px, 9px) rotate(-0.5deg); }   14% {     transform: translate(-8px, -9px) rotate(-0.5deg); }   16% {     transform: translate(4px, 0px) rotate(-1.5deg); }   18% {     transform: translate(-7px, 6px) rotate(3.5deg); }   20% {     transform: translate(1px, -4px) rotate(-0.5deg); }   22% {     transform: translate(1px, 4px) rotate(3.5deg); }   24% {     transform: translate(-4px, 8px) rotate(-2.5deg); }   26% {     transform: translate(-1px, -5px) rotate(1.5deg); }   28% {     transform: translate(-6px, -2px) rotate(1.5deg); }   30% {     transform: translate(3px, -6px) rotate(-1.5deg); }   32% {     transform: translate(-8px, 6px) rotate(2.5deg); }   34% {     transform: translate(4px, -1px) rotate(2.5deg); }   36% {     transform: translate(-3px, 2px) rotate(3.5deg); }   38% {     transform: translate(5px, -7px) rotate(1.5deg); }   40% {     transform: translate(4px, 9px) rotate(1.5deg); }   42% {     transform: translate(1px, -5px) rotate(2.5deg); }   44% {     transform: translate(-5px, -2px) rotate(-1.5deg); }   46% {     transform: translate(-3px, 2px) rotate(0.5deg); }   48% {     transform: translate(6px, 10px) rotate(-0.5deg); }   50% {     transform: translate(-8px, -1px) rotate(-1.5deg); }   52% {     transform: translate(5px, -3px) rotate(0.5deg); }   54% {     transform: translate(-6px, -9px) rotate(2.5deg); }   56% {     transform: translate(-1px, 1px) rotate(-1.5deg); }   58% {     transform: translate(2px, 0px) rotate(0.5deg); }   60% {     transform: translate(6px, 2px) rotate(-2.5deg); }   62% {     transform: translate(7px, 0px) rotate(-2.5deg); }   64% {     transform: translate(3px, 2px) rotate(-2.5deg); }   66% {     transform: translate(-1px, 4px) rotate(-2.5deg); }   68% {     transform: translate(0px, 8px) rotate(3.5deg); }   70% {     transform: translate(7px, -3px) rotate(1.5deg); }   72% {     transform: translate(6px, 8px) rotate(0.5deg); }   74% {     transform: translate(9px, 8px) rotate(-1.5deg); }   76% {     transform: translate(8px, 1px) rotate(2.5deg); }   78% {     transform: translate(2px, 1px) rotate(0.5deg); }   80% {     transform: translate(-7px, 10px) rotate(3.5deg); }   82% {     transform: translate(-1px, -5px) rotate(1.5deg); }   84% {     transform: translate(-5px, 7px) rotate(2.5deg); }   86% {     transform: translate(-6px, -2px) rotate(-0.5deg); }   88% {     transform: translate(-2px, -6px) rotate(0.5deg); }   90% {     transform: translate(10px, -7px) rotate(2.5deg); }   92% {     transform: translate(-6px, 4px) rotate(-2.5deg); }   94% {     transform: translate(-5px, -6px) rotate(0.5deg); }   96% {     transform: translate(8px, 9px) rotate(-0.5deg); }   98% {     transform: translate(1px, -8px) rotate(1.5deg); } }';
        window.addEventListener('load', function () {
            var style = document.createElement('style');
            style.innerHTML = css;
            document.head.appendChild(style);
        }, false);
    }

    var shakeEffectAttributeName = 'cordova-simulate-shake-effect';

    function vibrate (milliseconds, placeholderNum) {
        // indicating whether we will need to stop vibration effect or not
        var knownVibrationCallsCount = placeholderNum;

        var deferred = Q.defer();

        var root = document.body;

        // if this call is cancelVibration - immediately stop vibration by removing shake effect classes
        if (milliseconds === 0) {
            root.removeAttribute(shakeEffectAttributeName);
            return Q();
        }

        // in the case we calling vibrateWithPattern after cancelling vibration
        vibrationCanceled = false;

        root.setAttribute(shakeEffectAttributeName, '');
        for (var x = 0; x <= milliseconds; x = x + 100) {
            setTimeout(function () {
                stopIfVibrationCanceled(deferred, root);
            }, x);

            // stop vibrating in the end of vibration time if there is no more vibrations
            if (x >= milliseconds) {
                setTimeout(function () {
                    stopIfVibrationCanceled(deferred, root);
                    root.removeAttribute(shakeEffectAttributeName);
                    if (knownVibrationCallsCount === currentVibrationNum) {
                        vibrate(0);
                    }
                    deferred.resolve();
                }, milliseconds);
            }
        }

        return deferred.promise;
    }

    // if vibration is cancelled, we need to remove shake effect classes in the case to stop vibration effect
    function stopIfVibrationCanceled (deferred, element) {
        if (vibrationCanceled) {
            vibrationCanceled = false;
            element.removeAttribute(shakeEffectAttributeName);
            deferred.reject();
        }
    }

    function vibrateWithPattern (pattern, placeholderNum) {
        // checking if another vibrate with pattern call invoked
        if (currentVibrationNum != placeholderNum) {
            console.log('cancelling vibration with pattern');
            return Q();
        }

        var milliseconds = pattern[currenntVibrationWithPatternIndex];
        if (milliseconds) {
            if (currenntVibrationWithPatternIndex % 2 === 0) {
                console.log('vibrating...' + milliseconds);
                currenntVibrationWithPatternIndex++;
                return vibrate(milliseconds, placeholderNum)
                    .then(function () { 
                        return vibrateWithPattern(pattern, placeholderNum);
                    });
            } else {
                console.log('delaying...' + milliseconds);
                currenntVibrationWithPatternIndex++;
                return Q()
                    .delay(milliseconds)
                    .then(function () { 
                        return vibrateWithPattern(pattern, placeholderNum);
                    });
            }
        }
    }

    initializeVibrationSimulation();
};
