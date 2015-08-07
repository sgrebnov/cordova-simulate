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

    // Find the html import elements on the page
    var htmlImports = document.querySelectorAll('link[rel="import"]');
    var panelContainer = document.getElementById('left-panel');
    var dialogContainer = document.getElementById('popup-window');

    Array.prototype.forEach.call(htmlImports, function (htmlImport) {
        var href = htmlImport.href.split('/');
        var pluginId = href[href.length - 2];

        Array.prototype.forEach.call(htmlImport.import.querySelectorAll('cordova-panel'), function (panelDefinitionElement) {
            panelDefinitionElement.setAttribute('data-cordova-pluginid', pluginId);
            panelContainer.appendChild(panelDefinitionElement.cloneNode(true));
        });
        Array.prototype.forEach.call(htmlImport.import.querySelectorAll('cordova-dialog'), function (dialogDefinitionElement) {
            dialogDefinitionElement.setAttribute('data-cordova-pluginid', pluginId);
            var dialogElement = dialogDefinitionElement.cloneNode(true);
            dialogElement.style.display = 'none';
            dialogContainer.appendChild(dialogElement);
            cordova.pluginDialogs[dialogDefinitionElement.id] = dialogElement;
        });

        if (plugins[pluginId] && plugins[pluginId].initialize) {
            try{
                plugins[pluginId].initialize();
            } catch (e) {
                console.error('Error initializing plugin ' + pluginId);
                console.error(e);
            }
        }
    });
}
