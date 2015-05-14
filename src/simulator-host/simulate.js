var cordova = (function () {
    var pluginHanders = {};
    var pluginDialogs = {};

    function injectPluginHtml(pluginId, htmlInfo) {
        // Note that we expect to get called even if the plugin has no simulation UI defined!

        var fragment = FragmentLoader.load(htmlInfo);
        if (!fragment) {
            return false;
        }

        // Fragment contains the contents body of the imported HTML. We'll extract panels and dialogs and insert them
        // into the appropriate container elements.

        var panelContainer = document.getElementById('left-panel');
        Array.prototype.forEach.call(fragment.querySelectorAll('cordova-panel'), function (panelDefinitionElement) {
            var panel = PanelBuilder.createPanel(pluginId, panelDefinitionElement);
            panelContainer.appendChild(panel);
        });

        var dialogContainer = document.getElementById('dialog-wrapper');
        Array.prototype.forEach.call(fragment.querySelectorAll('cordova-dialog'), function (dialogDefinitionElement) {
            var dialog = PanelBuilder.createDialog(pluginId, dialogDefinitionElement);
            dialogContainer.appendChild(dialog);
            pluginDialogs[dialogDefinitionElement.id] = dialog;
        });

        return true;
    }

    var currentDialogId = null;
    function showDialog (dialogId) {
        var dialog = pluginDialogs[dialogId];
        if (!dialog) {
            throw "No dialog defined with id " + dialogId;
        }

        // We don't currently allow nesting dialogs, so close any existing dialog
        if (currentDialogId) {
            hideDialog(currentDialogId);
        }

        currentDialogId = dialogId;
        document.getElementById('popup-window').style.display = null;
        dialog.style.display = null;
    }

    function hideDialog (dialogId) {
        if (dialogId !== currentDialogId) {
            throw "Trying to hide a dialog that isn't currently showing: " + dialogId;
        }

        var dialog = pluginDialogs[dialogId];
        if (!dialog) {
            throw "No dialog defined with id " + dialogId;
        }

        currentDialogId = null;
        document.getElementById('popup-window').style.display = "none";
        dialog.style.display = "none";
    }

    function registerPluginHandlers(handlers) {
        for (var handlerId in handlers) {
            if (handlers.hasOwnProperty(handlerId)) {
                pluginHanders[handlerId] = handlers[handlerId];
            }
        }
    }

    return {
        registerPluginHandlers: registerPluginHandlers,
        showDialog: showDialog,
        hideDialog: hideDialog,
        pluginHanders: pluginHanders,
        injectPluginHtml: injectPluginHtml
    };
})();
