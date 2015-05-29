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

var fs              = require('fs'),
    path            = require('path'),
    replaceStream   = require('replacestream'),
    server          = require('cordova-serve');

var pluginPaths = [],
    pluginList;

var PLUGIN_SIMULATION_FILES = {
    'SIM_HOST_HTML': 'sim-host-controls.html',
    'SIM_HOST_JS': 'sim-host-controls.js',
    'APP_HOST_HTML': 'sim-app-host.js'
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
                var href = 'simulator/plugin/' + pluginId + '/' + pluginHtmlFileName;
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

function processUrlPath(urlPath, request, response, do302, do404) {
    // Possible return values:
    // 1. {filePath: value}: If value is a non-empty string, this will be the full qualified path the caller should use.
    //    Otherwise, if value is falsy, we have done no processing and the caller should determine the file path.
    // 2. null: We have handled the request - caller should do no more.

    if (urlPath.indexOf('/simulator/') !== 0) {
        // Not a path we care about
        return {filePath: null};
    }

    var splitPath = urlPath.split('/');

    // Remove the empty first element and 'simulator'
    splitPath.shift();
    splitPath.shift();

    if (splitPath[0] === 'app-host') {
        return {filePath: path.join(__dirname, splitPath.join('/'))};
    }

    if (splitPath[0] === 'plugin') {
        // Remove 'plugin'
        splitPath.shift();

        var pluginId = splitPath.shift();
        var pluginPath = pluginPaths[pluginId];
        return {filePath: pluginPath && path.join(pluginPath, splitPath.join('/'))};
    }

    var filePath = splitPath.join('/');
    if (filePath === 'index.html') {
        // Allow 'index.html' as a synonym for 'simulate.html'
        filePath = 'simulate.html';
    }
    return {filePath: path.join(__dirname, 'simulator-host', filePath)};
}

function streamFile(filePath, request, response) {
    var readStream;
    if (request.url === '/index.html' || request.url === '/') {
        // Inject plugin simulation app-host <script> references into index.html
        var scriptSources = [
            'https://cdn.socket.io/socket.io-1.2.0.js',
            '/simulator/app-host/app-host.js'
        ];
        var scriptTags = scriptSources.map(function (scriptSource) {
            return '<script src="' + scriptSource + '"></script>';
        }).join('');

        readStream = fs.createReadStream(filePath);
        server.sendStream(filePath, request, response, readStream.pipe(replaceStream(/<\s*head\s*>/, '<head>' + scriptTags)));
        return true;
    }
    if (request.url === '/simulator/app-host/app-host.js') {
        // Inject plugin simulation code. This is a bit nasty - we should probably create read streams for the
        // plugin simulation files, but good enough for prototype.
        var appHostScriptBasename = PLUGIN_SIMULATION_FILES.APP_HOST_HTML;
        var pluginCode = [];
        var pluginTemplate = '\'%PLUGINID%\': (function (module) {\n%PLUGINCODE%\nreturn module.exports(new Messages(\'%PLUGINID%\'));\n})({exports: new Function()})\n';
        pluginList.forEach(function (pluginId) {
            var pluginPath = pluginPaths[pluginId];
            var pluginAppHostScriptFile = pluginPath && path.join(pluginPath, appHostScriptBasename);
            if (pluginAppHostScriptFile && fs.existsSync(pluginAppHostScriptFile)) {
                pluginCode.push(pluginTemplate.replace(/%PLUGINID%/g, pluginId).replace(/%PLUGINCODE%/g, fs.readFileSync(pluginAppHostScriptFile, 'utf8')));
            }
        });

        readStream = fs.createReadStream(filePath);
        server.sendStream(filePath, request, response, readStream.pipe(replaceStream('/** PLUGINS **/', pluginCode.join(','))));
        return true;
    }
    return false;
}

module.exports = {
    processUrlPath: processUrlPath,
    streamFile: streamFile,
    init: init
};
