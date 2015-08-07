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

var savedSims = require('./saved-sims');
var event = require('event');

module.exports = {
    initialize: function () {
        var sims = savedSims.sims;

        var execList = document.getElementById('exec-list');
        execList.addEventListener('itemremoved', function (e) {
            savedSims.removeSim(e.detail.itemIndex);
            addEmptyItem();
        });

        event.on('saved-sim-added', function (sim) {
            removeEmptyItem();
            execList.addItem(cordovaItemFromSim(sim));
        });

        if (sims && sims.length) {
            sims.forEach(function (sim) {
                execList.addItem(cordovaItemFromSim(sim));
            });
        } else {
            // Create a "No values saved" item
            addEmptyItem();
        }
    }
};

function cordovaItemFromSim(sim) {
    var labeledValue = new CordovaLabeledValue();
    labeledValue.label = sim.service + '.' + sim.action;

    var value = sim.value;
    if (typeof value === 'object') {
        try {
            value = JSON.stringify(value);
        } catch (e) {
        }
    }

    labeledValue.value = value;
    var cordovaItem = new CordovaItem();
    cordovaItem.appendChild(labeledValue);
    return cordovaItem;
}

function createEmptyItem() {
    var labeledValue = new CordovaLabeledValue();
    labeledValue.label = 'No values saved';
    labeledValue.value = '';
    var cordovaItem = new CordovaItem();
    cordovaItem.appendChild(labeledValue);
    return cordovaItem;
}

var hasEmptyItem = false;
function addEmptyItem() {
    if (hasEmptyItem) {
        return;
    }

    var execList = document.getElementById('exec-list');
    var sims = savedSims.sims;
    if (sims.length === 0) {
        execList.addItem(createEmptyItem());
        hasEmptyItem = true;
    }
}

function removeEmptyItem() {
    if (!hasEmptyItem) {
        return;
    }

    var execList = document.getElementById('exec-list');
    execList.removeItem(0);
    hasEmptyItem = false;
}

