function initialize() {
    registerCustomElement('cordova-panel', null, function () {
        this.shadowRoot.querySelector('section section').textContent = this.getAttribute('caption');
    });

    registerCustomElement('cordova-dialog', null, function () {
        this.shadowRoot.querySelector('section section').textContent = this.getAttribute('caption');
    });

    registerCustomElement('cordova-panel-row');

    registerCustomElement('cordova-group');

    registerCustomElement('cordova-checkbox', null, function () {
        this.shadowRoot.querySelector('label').textContent = this.getAttribute('label');
    });

    registerCustomElement('cordova-radio', {
        checked: {
            get: function () {
                return this.shadowRoot.getElementById('cordova-radio-template-input').checked;
            }
        }
    }, function () {
        this.shadowRoot.querySelector('label').textContent = this.getAttribute('caption');

        var isChecked = this.getAttribute('checked');
        if (isChecked && isChecked.toLowerCase() === 'true') {
            this.shadowRoot.querySelector('input').checked = true;
        }

        var parentGroup = findParent(this, 'cordova-group');
        if (parentGroup) {
            var radioButton = this.shadowRoot.getElementById('cordova-radio-template-input');
            radioButton.setAttribute('name', parentGroup.id);
        }
    });

    registerCustomElement('cordova-label', null, function () {
        this.shadowRoot.querySelector('label').textContent = this.getAttribute('label');
    });

    registerCustomElement('cordova-text-entry', {
        value: {
            set: function (value) {
                this.shadowRoot.querySelector('input').value = value;
            },

            get: function () {
                return this.shadowRoot.querySelector('input').value;
            }
        }
    }, function () {
        this.shadowRoot.querySelector('label').textContent = this.getAttribute('label');
    });

    registerCustomElement('cordova-button', null, function () {
        this.shadowRoot.querySelector('span').textContent = this.getAttribute('caption');
    }, 'button');

    registerCustomElement('cordova-file', {
        input: {
            get: function () {
                return this.shadowRoot.querySelector('input');
            }
        },
        files: {
            get: function () {
                return this.shadowRoot.querySelector('input').files;
            }
        }
    }, 'input');

    registerCustomElement('cordova-combo', {
        options: {
            get: function () {
                return this.shadowRoot.querySelector('select').options;
            }
        },
        selectedIndex: {
            get: function () {
                return this.shadowRoot.querySelector('select').selectedIndex;
            }
        },
        appendChild: {
            value: function (node) {
                this.shadowRoot.querySelector('select').appendChild(node);
            }
        }
    }, function () {
        var label = this.getAttribute('label');
        if (label) {
            this.shadowRoot.querySelector('label').textContent = this.getAttribute('label');
        } else {
            this.shadowRoot.querySelector('select').style.width = '100%';
        }
    }, 'select');
}

function registerCustomElement(name, protoProperties, initializeCallback, eventTargetSelector) {
    if (typeof initializeCallback !== 'function') {
        eventTargetSelector = initializeCallback;
        initializeCallback = null;
    }

    var constructorName = name.split('-').map(function (bit) {
        return bit.charAt(0).toUpperCase() + bit.substr(1);
    }).join('');

    var proto = Object.create(HTMLElement.prototype);
    if (protoProperties) {
        Object.defineProperties(proto, protoProperties);
    }

    function initialize() {
        this.initialized = true;

        var eventTarget = eventTargetSelector && this.shadowRoot.querySelector(eventTargetSelector);
        var atts = this.attributes;
        Array.prototype.forEach.call(atts, function (att) {
            if (att.name.indexOf('on') === 0) {
                var attValue = mungeEventHandler(this, att);
                if (eventTarget) {
                    this.removeAttribute(att.name);
                    eventTarget.setAttribute(att.name, attValue);
                } else {
                    console.log('PROCESSING EVENT FOR OBJECT WITHOUT AN EVENT TARGET: ' + att.name);
                    if (attValue != att.value) {
                        this.setAttribute(att.name, attValue);
                    }
                }
            }
        }, this);


        // Initialize if it is required
        initializeCallback && initializeCallback.call(this);

        // Apply attributes
    }

    proto.attachedCallback = function () {
        if (!this.initialized) {
            // If it hasn't already been initialized, do so now.
            initialize.call(this);
        }
    };

    proto.createdCallback = function () {
        var t = document.getElementById(name + '-template');
        var shadowRoot = this.createShadowRoot();
        shadowRoot.appendChild(document.importNode(t.content, true));

        if (initializeCallback && this.ownerDocument === document) {
            // If it is being created in the main document, initialize immediately.
            initialize.call(this);
        }
    };

    window[constructorName] = document.registerElement(name, {
        prototype: proto
    });
}

function mungeEventHandler(element, att) {

    var attValue = att.value;
    var parentPanel = findParent(element, ['cordova-panel', 'cordova-dialog']);
    if (!parentPanel) {
        return attValue;
    }

    var pluginId = parentPanel.getAttribute('data-cordova-pluginid');
    if (!pluginId) {
        return attValue;
    }

    var handlers = window.plugins[pluginId];
    if (!handlers) {
        return attValue;
    }

    var pos = attValue.indexOf('(');
    if (pos === -1) {
        return attValue;
    }

    return handlers[attValue.substr(0, pos)] ? 'window.plugins[\'' + pluginId + '\'].' + attValue : attValue;
}

function findParent(element, tag) {
    if (!Array.isArray(tag)) {
        tag = [tag];
    }

    var parent = element.parentNode;
    return parent && parent.tagName ? tag.indexOf(parent.tagName.toLowerCase()) > -1 ? parent : findParent(parent, tag) : null;
}

module.exports = {
    initialize: initialize
};
