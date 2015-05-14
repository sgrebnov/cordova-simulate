var PanelBuilder = (function () {
    function createPanel(pluginId, panelDefinition) {
        var id = panelDefinition.getAttribute('id');
        var caption = panelDefinition.getAttribute('caption');

        // Create the outer section
        var panelElement = document.createElement('section');
        if (id) {
            panelElement.id = id;
        }
        panelElement.className = 'cordova-box cordova-state-default cordova-corner cordova-box-open';

        // Create the title bar
        var captionElement = document.createElement('section');
        captionElement.className = 'h2 cordova-header cordova-collapse-handle';
        var captionText = document.createTextNode(caption);
        captionElement.appendChild(captionText);

        panelElement.appendChild(captionElement);

        // Create a section that will wrap the contents of the panel
        var contentElement = document.createElement('section');
        contentElement.className = 'cordova-info cordova-widget-content cordova-corner';

        processChildren(pluginId, contentElement, panelDefinition);

        panelElement.appendChild(contentElement);

        return panelElement;
    }

    function createDialog(pluginId, dialogDefinition) {
        var dialogElement = createPanel(pluginId, dialogDefinition);
        dialogElement.style.display = 'none';
        return dialogElement;
    }

    function processChildren(pluginId, newParent, definitionParent) {
        var definitionChildren = definitionParent.childNodes;
        for (var i = 0; i < definitionChildren.length; i++) {
            var definitionChild = definitionChildren[i];
            var newChild = null;

            var isElement = definitionChild.nodeType === Node.ELEMENT_NODE;
            if (isElement && definitionChild.tagName.indexOf('-') > -1) {
                newChild = processElement(definitionChild);
            } else {
                newChild = definitionChild.cloneNode(false /* deep */);
            }

            if (newChild) {
                newParent.appendChild(newChild);
                newParent.appendChild(document.createTextNode('\n'));

                if (isElement) {
                    processChildren(pluginId, newChild, definitionChild);
                }
            }
        }
    }

    // Simple hard-coded replacement for now
    function processElement(definitionElement) {
        var tag = definitionElement.tagName.toLowerCase();
        var newElement = null;

        switch(tag) {
            case 'cordova-group':
                newElement = document.createElement('section');
                newElement.id = definitionElement.id;
                break;

            case 'cordova-panel-row':
                newElement = document.createElement('section');
                newElement.className = 'cordova-panel-row';
                break;

            case 'cordova-radio':
                newElement = document.createElement('section');

                var isInline = definitionElement.getAttribute('inline');
                isInline = isInline && isInline.toLowerCase() === 'true';
                newElement.className = isInline ? 'cordova-radio-wrapper cordova-inline' : 'cordova-radio-wrapper';

                var radioElement = document.createElement('input');
                if (definitionElement.id) {
                    radioElement.id = definitionElement.id;
                }
                radioElement.type = 'radio';
                var isChecked = definitionElement.getAttribute('checked');
                if (isChecked && isChecked.toLowerCase() === 'true') {
                    radioElement.checked = true;
                }
                var parentGroup = findParent(definitionElement, 'cordova-group');
                if (parentGroup) {
                    radioElement.name = parentGroup.id;
                }
                newElement.appendChild(radioElement);

                var radioLabelElement = document.createElement('label');
                radioLabelElement.setAttribute('for', radioElement.id);
                radioLabelElement.className = 'cordova-radio-label';
                var radioCaptionText = document.createTextNode(definitionElement.getAttribute('caption'));
                radioLabelElement.appendChild(radioCaptionText);
                newElement.appendChild(radioLabelElement);
                break;

            case 'cordova-button':
                newElement = document.createElement('button');
                newElement.className = 'cordova-button cordova-widget cordova-state-default cordova-corner cordova-button-text-only cordova-small-button';
                if (definitionElement.id) {
                    newElement.id = definitionElement.id;
                }

                var style = definitionElement.getAttribute('style');
                if (style) {
                    newElement.setAttribute('style', style);
                }
                newElement.style = definitionElement.style;

                var span = document.createElement('span');
                span.className = 'cordova-button-text';
                var buttonCaptionText = document.createTextNode(definitionElement.getAttribute('caption'));
                span.appendChild(buttonCaptionText);

                newElement.appendChild(span);

                break;

            case 'cordova-file':
                newElement = document.createElement('input');
                newElement.type = 'file';
                newElement.style.display = 'none';
                if (definitionElement.id) {
                    newElement.id = definitionElement.id;
                }

                break;

            case 'cordova-combo':
                newElement = document.createElement('section');
                newElement.className = 'cordova-panel-row';

                var comboLabelElement = document.createElement('label');
                comboLabelElement.setAttribute('for', definitionElement.id);
                var comboLabelText = document.createTextNode(definitionElement.getAttribute('label'));
                comboLabelElement.appendChild(comboLabelText);
                newElement.appendChild(comboLabelElement);

                var selectElement = document.createElement('select');
                selectElement.className = "cordova-state-default cordova-corner";
                selectElement.id = definitionElement.id;
                newElement.appendChild(selectElement);

                break;

            case 'cordova-text-entry':
                newElement = document.createElement('section');
                newElement.className = 'cordova-panel-row';

                var textEntryLabelElement = document.createElement('label');
                textEntryLabelElement.setAttribute('for', definitionElement.id);
                var textEntryLabelText = document.createTextNode(definitionElement.getAttribute('label'));
                textEntryLabelElement.appendChild(textEntryLabelText);
                newElement.appendChild(textEntryLabelElement);

                var inputElement = document.createElement('input');
                inputElement.className = 'cordova-state-default cordova-corner';
                inputElement.id = definitionElement.id;
                inputElement.type = 'text';
                newElement.appendChild(inputElement);

                break;

            default:
                console.log('*** Unhandled tag: ' + tag);
                newElement = definitionElement.cloneNode(false /* deep */);

        }

        processEventAttributes(definitionElement, newElement);
        newElement.setAttribute('_cordovaTag', tag);

        return newElement;
    }

    function processEventAttributes(definitionElement, newElement) {
        var atts = definitionElement.attributes;
        for (var i = 0; i < atts.length; i++) {
            var att = atts[i];
            if (att.name.indexOf('on') === 0) {
                newElement.setAttribute(att.name, att.value);
            }
        }
    }

    function findParent(element, tag) {
        var parent = element.parentNode;
        return parent ? parent.getAttribute('_cordovaTag') === tag || parent.tagName.toLowerCase() === tag ? parent : findParent(parent, tag) : null;
    }

    return {
        createDialog: createDialog,
        createPanel: createPanel
    };
})();