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

var db = require('db'),
    event = require('event');

var _sims = null;

module.exports = {
    get sims() {
        if (!_sims) {
            _sims = db.retrieveObject('saved-sims') || [];
        }
        return _sims;
    },

    addSim: function (sim) {
        var sims = this.sims;
        sims.push(sim);
        db.saveObject('saved-sims', sims);
        event.trigger('saved-sim-added', [sim]);
    },

    removeSim: function (sim) {
        var sims = this.sims;
        var simIndex = sim;
        if (typeof simIndex === 'object') {
            simIndex = sims.indexOf(simIndex);
            if (simIndex < 0) {
                throw 'Tried to remove sim object that didn\'t exist';
            }
        } else if (typeof simIndex === 'number') {
            if (simIndex < 0 || simIndex >= sims.length) {
                throw 'Invalid saved sim index ' + simIndex + ' (should be from 0 to ' + sims.length - 1 + ')';
            }
            sim = sims[simIndex];
        } else {
            throw 'Invalid value passed to removeSim(): ' + sim;
        }

        sims.splice(simIndex, 1);
        db.saveObject('saved-sims', sims);
        event.trigger('saved-sim-removed', [sim, simIndex]);
    },

    findSavedSim: function(service, action) {
        var sims = this.sims;

        var savedSim = null;

        sims.some(function (sim) {
            if (sim.service === service && sim.action === action) {
                savedSim = sim;
                return true;
            }
            return false;
        });

        return savedSim;
    }
};

