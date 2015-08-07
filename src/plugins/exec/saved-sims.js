// TODO: Currently sim-host includes each plugin's sim-host.js as a separate file rather than using browserify
// to build them into one single conglomerate. This means we end up with separate instances of required() files like
// this one, and hence separate instances of our saved sim data. To work around that, we temporarily always work with
// the value saved to storage.

var db = require('db'),
    event = require('event');

// Restore this once we are properly browserifying sim-host files.
//var _sims = null;

module.exports = {
    get sims() {
        // Restore this once we are properly browserifying sim-host files.
        //if (!_sims) {
        //    _sims = db.retrieveObject('saved-sims') || [];
        //}
        //return _sims;

        return db.retrieveObject('saved-sims') || [];
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

