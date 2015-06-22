#!/usr/bin/env node

/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

var fs            = require('fs'),
    path          = require('path'),
    replaceStream = require('replacestream'),
    server        = require('cordova-serve'),
    wrap          = require('wrap-stream');

var pluginPaths = [],
    pluginList;

var PLUGIN_SIMULATION_FILES = {
    'SIM_HOST_HTML': 'sim-host-controls.html',
    'SIM_HOST_JS': 'sim-host-controls.js',
    'APP_HOST_JS': 'sim-app-host.js'
};

function init(server, root) {
    var io = require('socket.io')(server);

    this.server = server;
    this.io = io;

    var app_host_socket;
    var simulation_host_socket;

    initPluginList();
    initPluginPaths();

    io.on('connection', function (socket) {
        socket.on('register-app-host', function () {
            console.log('APP HOST REGISTERED WITH SERVER');

            // It only makes sense to have one app host per server. If more than one tries to connect, always take the
            // most recent.
            app_host_socket = socket;

            socket.on('exec', function (data) {
                emitToSimulationHost('exec', data);
            });

            socket.on('plugin-info', function (data) {
                emitToSimulationHost('plugin-info', data);
            });

            socket.on('plugin-message', function (data, callback) {
                emitToSimulationHost('plugin-message', data, callback);
            });
        });

        socket.on('register-simulation-host', function () {
            console.log('SIMULATION HOST REGISTERED WITH SERVER');

            // It only makes sense to have one simulation host per server. If more than one tries to connect, always
            // take the most recent.
            simulation_host_socket = socket;

            socket.on('exec-success', function (data) {
                emitToAppHost('exec-success', data);
            });
            socket.on('exec-failure', function (data) {
                emitToAppHost('exec-failure', data);
            });

            socket.on('request-plugin-info', function (data, callback) {
                emitToAppHost('request-plugin-info', data, callback);
            });

            socket.on('plugin-message', function (data, callback) {
                emitToAppHost('plugin-message', data, callback);
            });

            socket.on('get-plugin-list', function (data, callback) {
                callback(pluginList);
            });

            socket.on('get-plugin-info', function (pluginId, callback) {
                var pluginHtmlFileName = PLUGIN_SIMULATION_FILES.SIM_HOST_HTML;
                var pluginPath = pluginPaths[pluginId];
                var pluginFilePath = pluginPath && path.join(pluginPath, pluginHtmlFileName);

                // We provide an href for the simulation host to use when processing this html (for resolving script and
                // img references, for example).
                var href = 'plugin/' + pluginId + '/' + pluginHtmlFileName;
                var returnValue = {href: href, html: ''};

                if (fs.existsSync(pluginFilePath)) {
                    fs.readFile(pluginFilePath, 'utf8', function (err, html) {
                        if (!err) {
                            returnValue.html = html;
                        }
                        callback(returnValue);
                    });
                } else {
                    callback(returnValue);
                }
            });
        });
    });

    function emitToSimulationHost(msg, data, callback) {
        emitToHosts(simulation_host_socket, msg, data, callback);
    }

    function emitToAppHost(msg, data, callback) {
        emitToHosts(app_host_socket, msg, data, callback);
    }

    function emitToHosts(host, msg, data, callback) {
        if (host) {
            host.emit(msg, data, callback);
        }
    }

    function initPluginList() {
        // Always defined plugins
        pluginList = ['events'];

        var pluginPath = path.resolve(root, 'plugins');
        if (fs.existsSync(pluginPath)) {
            fs.readdirSync(pluginPath).forEach(function (file) {
                if (fs.statSync(path.join(pluginPath, file)).isDirectory()) {
                    pluginList.push(file);
                }
            });
        }

        if (pluginList.indexOf('cordova-plugin-geolocation') === -1) {
            pluginList.push('cordova-plugin-geolocation');
        }
    }

    function initPluginPaths() {
        pluginList.forEach(function (pluginId) {
            // To be recognized for simulations, we need to find one of the known simulation files
            // (sim-host-controls.html, sim-host-controls.js or sim-app-host.js)
            for (var file in PLUGIN_SIMULATION_FILES) {
                var pluginFilePath = findPluginSourceFilePath(pluginId, PLUGIN_SIMULATION_FILES[file]);
                if (pluginFilePath) {
                    pluginPaths[pluginId] = pluginFilePath;
                    break;
                }
            }
        });
    }

    function findPluginSourceFilePath(pluginId, file) {
        // We know the the target platform's 'www' folder ('root'), but we need to find the Cordova project root to find
        // the plugins folder (since simulation related files won't be copied into the platform's plugins folder).
        var pathArray = root.split(path.sep);
        var pluginsDir = pathArray.slice(0, pathArray.lastIndexOf('platforms')).concat('plugins').join(path.sep);
        var pluginPath = path.resolve(pluginsDir, pluginId, 'src/simulation');
        var pluginFilePath = path.resolve(pluginPath, file);

        if (fs.existsSync(pluginFilePath)) {
            return pluginPath;
        }

        pluginPath = path.join(__dirname, 'plugins', pluginId);
        pluginFilePath = path.join(pluginPath, file);
        if (fs.existsSync(pluginFilePath)) {
            return pluginPath;
        }

        return null;
    }
}

function handleUrlPath(urlPath, request, response, do302, do404, serveFile) {
    if (urlPath.indexOf('/node_modules/') === 0) {
        // Something in our node_modules...
        serveFile(path.resolve(__dirname, '..', urlPath.substr(1)));
        return;
    }

    if (urlPath.indexOf('/simulator/') !== 0) {
        // Not a path we care about
        serveFile();
        return;
    }

    var splitPath = urlPath.split('/');

    // Remove the empty first element and 'simulator'
    splitPath.shift();
    splitPath.shift();

    if (splitPath[0] === 'app-host') {
        serveFile(path.join(__dirname, splitPath.join('/')));
        return;
    }

    if (splitPath[0] === 'plugin') {
        // Remove 'plugin'
        splitPath.shift();

        var pluginId = splitPath.shift();
        var pluginPath = pluginPaths[pluginId];
        serveFile(pluginPath && path.join(pluginPath, splitPath.join('/')));
        return;
    }

    var filePath = splitPath.join('/');
    if (filePath === 'index.html') {
        // Allow 'index.html' as a synonym for 'simulate.html'
        filePath = 'simulate.html';
    }
    serveFile(path.join(__dirname, 'simulator-host', filePath));
}

function processPluginRequires(pluginCode) {
    // Look for x, where x is in require('x') or require("x")
    var regexp = /require\(["']([^'^"]+)["']\)/g;
    var result;
    var requires = [];
    while ((result = regexp.exec(pluginCode)) !== null) {
        if (result[1].indexOf('.') === 0) {
            requires.push(result[1]);
        }
    }
    return requires.length ? requires : null;
}

function streamFile(filePath, request, response) {
    if (request.url === '/index.html' || request.url === '/') {
        // Inject plugin simulation app-host <script> references into index.html
        var scriptSources = [
            'https://cdn.socket.io/socket.io-1.2.0.js',
            '/simulator/app-host/app-host.js'
        ];
        var scriptTags = scriptSources.map(function (scriptSource) {
            return '<script src="' + scriptSource + '"></script>';
        }).join('');

        server.sendStream(filePath, request, response, fs.createReadStream(filePath).pipe(replaceStream(/<\s*head\s*>/, '<head>' + scriptTags)), true);
        return true;
    }
    if (request.url === '/simulator/app-host/app-host.js') {
        streamAppHost(filePath, request, response);
        return true;
    }
    if (request.url === '/simulator/index.html' || request.url === '/simulator/simulate.html') {
        streamSimulator(filePath, request, response);
        return true;
    }

    var requestPathArray = request.url.split('/');
    if (requestPathArray[1] === 'simulator' && requestPathArray[2] === 'plugin' && requestPathArray[4] === PLUGIN_SIMULATION_FILES.SIM_HOST_JS) {
        var pluginId = requestPathArray[3];

        var pluginCode = fs.readFileSync(filePath, 'utf-8');
        var pluginRequires = processPluginRequires(pluginCode);
        var requireCode = '';
        var requireCall = 'function (requireId) {\n' +
            'return Require.require(\'' + pluginId + '\', requireId);\n' +
            '}';

        if (pluginRequires) {
            var requireTemplate = 'Require.registerModule(\'%PLUGINID%\', \'%REQUIREID%\', (function (module, require) {\n%REQUIRECODE%\nreturn module.exports;\n})({exports:{}}, ' + requireCall + ')';
            //var requirePluginTemplate = 'var localRequires = {\n%PLUGINREQUIRES%\n}';
            //var requireCodeForPlugin = [];
            var pluginPath = pluginPaths[pluginId];
            pluginRequires.forEach(function (requireId) {
                var requireScriptFile = findRequireFile(pluginPath, requireId);
                if (!requireScriptFile) {
                    console.error('Cannot find module \'' + requireId + '\' for plugin \'' + pluginId + '\'');
                } else {
                    requireCode += requireTemplate.replace(/%PLUGINID%/g, pluginId).replace(/%REQUIREID%/g, requireId).replace(/%REQUIRECODE%/g, fs.readFileSync(requireScriptFile, 'utf8')) + ');\n\n';
                }
            });
        }

        var beforeCode = requireCode + '\n' +
                'var plugins = plugins || {};\n' +
                'plugins[\'' + pluginId + '\'] = (function (module, require) {\n\n';
        var afterCode =
                '\nreturn module.exports;\n' +
                '})({exports: {}}, ' + requireCall + ');\n';

//requireCode
        server.sendStream(filePath, request, response, fs.createReadStream(filePath).pipe(wrap(beforeCode, afterCode)), true);
        return true;
    }

    server.sendStream(filePath, request, response, null, true);
    return true;
}

function streamSimulator(filePath, request, response) {
    // Inject references to simulation HTML files
    var simHostHtmlBasename = PLUGIN_SIMULATION_FILES.SIM_HOST_HTML;
    var pluginHtml = [];
    var pluginLinkTemplate = '<link id="%PLUGINID%-import" rel="import" href="plugin/%PLUGINID%/sim-host-controls.html">';
    pluginList.forEach(function (pluginId) {
        var pluginPath = pluginPaths[pluginId];
        var pluginSimHostHtmlFile = pluginPath && path.join(pluginPath, simHostHtmlBasename);
        if (pluginSimHostHtmlFile && fs.existsSync(pluginSimHostHtmlFile)) {
            pluginHtml.push(pluginLinkTemplate.replace(/%PLUGINID%/g, pluginId));
        }
    });
    server.sendStream(filePath, request, response, fs.createReadStream(filePath).pipe(replaceStream(/<\/\s*head\s*>/, pluginHtml.join('\n') + '</head>')), true);
}

function streamAppHost(filePath, request, response) {
    var appHostScriptBasename = PLUGIN_SIMULATION_FILES.APP_HOST_JS;
    var pluginCode = [];
    var allPluginRequires = {};
    var pluginScriptTemplate = '\'%PLUGINID%\': (function (module, require) {\n%PLUGINCODE%\nreturn module.exports(new Messages(\'%PLUGINID%\'));\n})({exports: function () {}}, Require(\'%PLUGINID%\'))';
    pluginList.forEach(function (pluginId) {
        var pluginPath = pluginPaths[pluginId];
        var pluginAppHostScriptFile = pluginPath && path.join(pluginPath, appHostScriptBasename);
        if (pluginAppHostScriptFile && fs.existsSync(pluginAppHostScriptFile)) {
            var code = fs.readFileSync(pluginAppHostScriptFile, 'utf8');
            var pluginRequires = processPluginRequires(code);
            if (pluginRequires) {
                allPluginRequires[pluginId] = pluginRequires;
            }
            pluginCode.push(pluginScriptTemplate.replace(/%PLUGINID%/g, pluginId).replace(/%PLUGINCODE%/g, code));
        }
    });

    // Include local required modules
    var requireCodeForAllPlugins = [];
    var requirePluginTemplate = '\'%PLUGINID%\': {\n%PLUGINREQUIRES%\n}';
    var requireTemplate = '\'%REQUIREID%\': (function (module, require) {\n%REQUIRECODE%\n})(function () {}, Require())';
    pluginList.forEach(function (pluginId) {
        if (allPluginRequires[pluginId]) {
            var requireCodeForPlugin = [];
            var pluginPath = pluginPaths[pluginId];
            allPluginRequires[pluginId].forEach(function (requireId) {
                var requireScriptFile = findRequireFile(pluginPath, requireId);
                if (!requireScriptFile) {
                    console.error('Cannot find module \'' + requireId + '\' for plugin \'' + pluginId + '\'');
                } else {
                    var requireCode = fs.readFileSync(requireScriptFile, 'utf8');
                    requireCodeForPlugin.push(requireTemplate.replace(/%REQUIREID%/g, requireId).replace(/%REQUIRECODE%/g, requireCode));
                }
            });
            requireCodeForAllPlugins.push(requirePluginTemplate.replace(/%PLUGINID%/g, pluginId).replace(/%PLUGINREQUIRES%/g, requireCodeForPlugin.join(',')));
        }
    });

    server.sendStream(filePath, request, response, fs.createReadStream(filePath).pipe(replaceStream('/** PLUGINS **/', pluginCode.join(',\n'))).pipe(replaceStream('/** REQUIRES **/', requireCodeForAllPlugins.join(','))), true);
}

function findRequireFile(pluginPath, requireId) {
    var requireScriptFile = path.resolve(pluginPath, requireId);
    if (fs.existsSync(requireScriptFile)) {
        return requireScriptFile;
    }
    requireScriptFile = path.resolve(pluginPath, requireId + '.js');
    if (fs.existsSync(requireScriptFile)) {
        return requireScriptFile;
    }
    requireScriptFile = path.resolve(pluginPath, requireId + '.json');
    if (fs.existsSync(requireScriptFile)) {
        return requireScriptFile;
    }
    return null;
}

module.exports = {
    handleUrlPath: handleUrlPath,
    streamFile: streamFile,
    init: init
};
