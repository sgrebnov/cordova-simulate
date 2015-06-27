function initialize() {
    registerCustomElement('cordova-panel', function () {
        this.shadowRoot.querySelector('section').textContent = this.getAttribute('caption');
    });

    registerCustomElement('cordova-dialog', function () {
        this.shadowRoot.querySelector('section').textContent = this.getAttribute('caption');
    });

    registerCustomElement('cordova-panel-row', function () {
        this.classList.add('cordova-panel-row');
        this.classList.add('cordova-group');
    });

    registerCustomElement('cordova-group', function () {
        this.classList.add('cordova-group');
    });

    registerCustomElement('cordova-checkbox', {
        checked: {
            get: function () {
                return this.shadowRoot.getElementById('cordova-checkbox-template-input').checked;
            },
            set: function (value) {
                this.shadowRoot.getElementById('cordova-checkbox-template-input').checked = value;
            }
        }
    }, function () {
        this.classList.add('cordova-panel-row');
        this.classList.add('cordova-group');
    });

    registerCustomElement('cordova-radio', {
        checked: {
            get: function () {
                return this.shadowRoot.getElementById('cordova-radio-template-input').checked;
            },
            set: function (value) {
                this.shadowRoot.getElementById('cordova-radio-template-input').checked = value;
            }
        }
    }, function () {
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

    registerCustomElement('cordova-label', {
        textContent: {
            set: function (value) {
                this.shadowRoot.querySelector('label').textContent = value;
            },
            get: function () {
                return this.shadowRoot.querySelector('label').textContent;
            }
        }
    }, function () {
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
        this.classList.add('cordova-panel-row');
        this.classList.add('cordova-group');
    }, 'input');

    registerCustomElement('cordova-button', 'button');

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
        this.classList.add('cordova-panel-row');
        this.classList.add('cordova-group');
        var label = this.getAttribute('label');
        if (label) {
            this.shadowRoot.querySelector('label').textContent = this.getAttribute('label');
        } else {
            this.shadowRoot.querySelector('select').style.width = '100%';
        }
    }, 'select');
}

function registerCustomElement(name) {
    var args = arguments;
    function findArg(argType) {
        return Array.prototype.find.call(args, function (arg, index) {
            return index > 0 && (typeof arg === argType);
        });
    }

    var protoProperties = findArg('object');
    var initializeCallback = findArg('function');
    var eventTargetSelector = findArg('string');

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
        if (eventTarget) {
            // Make sure added events are redirected
            Object.defineProperty(this, 'addEventListener', {
                value: function (arg1, arg2, arg3) {
                    eventTarget.addEventListener(arg1, arg2, arg3);
                }
            });
        }

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

if (!Array.prototype.find) {
    Array.prototype.find = function(predicate) {
        if (this == null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}
