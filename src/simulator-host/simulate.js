var db             = require('db'),
    Messages       = require('messages'),
    customElements = require('./custom-elements'),
    socket         = require('./socket'),
    cordova        = require('cordova');

var plugins;
var pluginHandlers = {};

customElements.initialize();
socket.initialize(pluginHandlers);

window.addEventListener('load', function () {
    // Initialize standard modules, then plugins
    db.initialize().then(initializePlugins);
});

var pluginMessages = {};
function applyPlugins(plugins, clobberScope) {
    Object.keys(plugins).forEach(function (pluginId) {
        var plugin = plugins[pluginId];
        if (plugin) {
            if (typeof plugin === 'function') {
                pluginMessages[pluginId] = pluginMessages[pluginId] || new Messages(pluginId, socket.socket);
                plugin = plugin(pluginMessages[pluginId]);
                plugins[pluginId] = plugin;
            }
            if (clobberScope) {
                clobber(plugin, clobberScope);
            }
        }
    });
}

function clobber(clobbers, scope) {
    Object.keys(clobbers).forEach(function (key) {
        if (clobbers[key] && typeof clobbers[key] === 'object') {
            scope[key] =  scope[key] || {};
            clobber(clobbers[key], scope[key]);
        } else {
            scope[key] = clobbers[key];
        }
    });
}

function initializePlugins() {
    plugins = {
        /** PLUGINS **/
    };

    var pluginHandlersDefinitions = {
        /** PLUGIN-HANDLERS **/
    };

    applyPlugins(plugins);
    applyPlugins(pluginHandlersDefinitions, pluginHandlers);

    // Hide and register dialogs
    Array.prototype.forEach.call(document.getElementById('popup-window').children, function (dialog) {
        cordova.pluginDialogs[dialog.id] = dialog;
        dialog.style.display = 'none';
    });

    Object.keys(plugins).forEach(function (pluginId) {
        try{
            plugins[pluginId].initialize && plugins[pluginId].initialize();
        } catch (e) {
            console.error('Error initializing plugin ' + pluginId);
            console.error(e);
        }
    });
}
