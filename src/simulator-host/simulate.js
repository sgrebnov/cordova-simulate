var cordova = (function () {
    var pluginHandlers = {};
    var pluginDialogs = {};

    window.addEventListener('load', function () {
        // Find the html import elements on the page
        var htmlImports = document.querySelectorAll('link[rel="import"]');
        var panelContainer = document.getElementById('left-panel');
        var dialogContainer = document.getElementById('dialog-wrapper');
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
                pluginDialogs[dialogDefinitionElement.id] = dialogElement;
            });
            if (plugins[pluginId].initialize) {
                plugins[pluginId].initialize();
            }
        });
    });

    var currentDialogId = null;

    function showDialog(dialogId) {
        var dialog = pluginDialogs[dialogId];
        if (!dialog) {
            throw 'No dialog defined with id ' + dialogId;
        }

        // We don't currently allow nesting dialogs, so close any existing dialog
        if (currentDialogId) {
            hideDialog(currentDialogId);
        }

        currentDialogId = dialogId;
        document.getElementById('popup-window').style.display = null;
        dialog.style.display = null;
    }

    function hideDialog(dialogId) {
        if (dialogId !== currentDialogId) {
            throw 'Trying to hide a dialog that isn\'t currently showing: ' + dialogId;
        }

        var dialog = pluginDialogs[dialogId];
        if (!dialog) {
            throw 'No dialog defined with id ' + dialogId;
        }

        currentDialogId = null;
        document.getElementById('popup-window').style.display = 'none';
        dialog.style.display = 'none';
    }

    function registerPluginHandlers(handlers) {
        for (var handlerId in handlers) {
            if (handlers.hasOwnProperty(handlerId)) {
                pluginHandlers[handlerId] = handlers[handlerId];
            }
        }
    }

    return {
        registerPluginHandlers: registerPluginHandlers,
        showDialog: showDialog,
        hideDialog: hideDialog,
        pluginHandlers: pluginHandlers
    };
})();
