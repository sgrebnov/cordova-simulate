var db             = require('db'),
    Messages       = require('messages'),
    customElements = require('./custom-elements'),
    socket         = require('./socket'),
    cordova        = require('cordova');

window.plugins = {};
var plugins = window.plugins;

customElements.initialize();
socket.initialize();

window.addEventListener('load', function () {
    // Initialize standard modules, then plugins
    db.initialize().then(initializePlugins);
});

function initializePlugins() {
    // Find the html import elements on the page
    var htmlImports = document.querySelectorAll('link[rel="import"]');
    var panelContainer = document.getElementById('left-panel');
    var dialogContainer = document.getElementById('popup-window');

    Array.prototype.forEach.call(htmlImports, function (htmlImport) {
        var href = htmlImport.href.split('/');
        var pluginId = href[href.length - 2];

        try {
            var plugin = require(pluginId);
        } catch (e) {
            console.log(e);
        }

        if (plugin) {
            if (typeof plugin === 'function') {
                var messages = new Messages(pluginId, socket.socket);
                plugins[pluginId] = plugin(messages);
            } else {
                plugins[pluginId] = plugin;
            }
        }
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
                console.log('Error initializing plugin ' + pluginId);
                console.log(e);
            }
        }
    });
}
