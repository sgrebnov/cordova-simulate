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

var browserify    = require('browserify'),
    fs            = require('fs'),
    path          = require('path'),
    replaceStream = require('replacestream'),
    server        = require('cordova-serve'),
    through2      = require('through2');

var pluginPaths = [],
    pluginList;

var PLUGIN_SIMULATION_FILES = {
    'SIM_HOST': {
        'HTML': 'sim-host.html',
        'JS': 'sim-host.js',
        'HANDLERS': 'sim-host-handlers.js'
    },
    'APP_HOST': {
        'JS': 'app-host.js',
        'HANDLERS': 'app-host-handlers.js',
        'CLOBBERS': 'app-host-clobbers.js'
    }
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
                var pluginHtmlFileName = PLUGIN_SIMULATION_FILES.SIM_HOST.HTML;
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
        console.log('APP-HOST to SIM-HOST: ' + msg);
        emitToHosts(simulation_host_socket, msg, data, callback);
    }

    function emitToAppHost(msg, data, callback) {
        console.log('SIM-HOST to APP-HOST: ' + msg);
        emitToHosts(app_host_socket, msg, data, callback);
    }

    function emitToHosts(host, msg, data, callback) {
        if (host) {
            host.emit(msg, data, callback);
        }
    }

    function initPluginList() {
        // Always defined plugins
        pluginList = ['exec','events'];

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
            // (such as sim-host.html, sim-host.js or app-host.js)
            var pluginFilePath = findPluginPath(pluginId);
            if (pluginFilePath) {
                pluginPaths[pluginId] = pluginFilePath;
            }
        });
    }

    function findPluginPath(pluginId, hostType) {
        if (!hostType) {
            return findPluginPath(pluginId, 'SIM_HOST') || findPluginPath(pluginId, 'APP_HOST');
        }
        for (var file in PLUGIN_SIMULATION_FILES[hostType]) {
            var pluginFilePath = findPluginSourceFilePath(pluginId, PLUGIN_SIMULATION_FILES[hostType][file]);
            if (pluginFilePath) {
                return pluginFilePath;
            }
        }
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

        // Note we replace "default-src 'self'" with "default-src 'self' ws:" (in Content Security Policy) so that
        // websocket connections are allowed.
        server.sendStream(filePath, request, response, fs.createReadStream(filePath)
            .pipe(replaceStream(/<\s*head\s*>/, '<head>' + scriptTags))
            .pipe(replaceStream('default-src \'self\'', 'default-src \'self\' ws:')), true);
        return true;
    }
    if (request.url === '/simulator/app-host/app-host.js') {
        streamAppHostJs(filePath, request, response);
        return true;
    }
    if (request.url === '/simulator/index.html' || request.url === '/simulator/simulate.html') {
        streamSimulator(filePath, request, response);
        return true;
    }

    if (request.url === '/simulator/simulate.js') {
        streamSimulatorJs2(filePath, request, response);
        return true;
    }

    var requestPathArray = request.url.split('/');
    if (requestPathArray[1] === 'simulator' && requestPathArray[2] === 'plugin' && requestPathArray[4] === PLUGIN_SIMULATION_FILES.SIM_HOST.JS) {
        streamPluginSimHostJs(filePath, requestPathArray[3], request, response);
        return true;
    }

    server.sendStream(filePath, request, response, null, true);
    return true;
}

var _browserifySearchPaths = null;
function getBrowserifySearchPaths() {
    _browserifySearchPaths = _browserifySearchPaths || [path.join(__dirname, 'modules'), path.join(__dirname, 'third-party')];
    return _browserifySearchPaths;
}

var _commonModules = null;
function getCommonModules() {
    if (!_commonModules) {
        _commonModules = [];
        getBrowserifySearchPaths().forEach(function (searchPath) {
            fs.readdirSync(searchPath).forEach(function (file) {
                if (path.extname(file) === '.js') {
                    _commonModules.push({name: path.basename(file, '.js'), file: path.join(searchPath, file)});
                }
            });
        });
    }
    return _commonModules;
}

function streamPluginSimHostJs(filePath, pluginId, request, response) {
    // TODO: Optimize this so we build the file once and reuse it, unless dependencies have changed
    var b = browserify({paths: getBrowserifySearchPaths()});

    // Exclude common modules since they will be included with the main sim js file.
    getCommonModules().forEach(function (module) {
        b.exclude(module.name);
    });

    b.require(filePath, {expose: pluginId});
    var bundle = b.bundle();
    server.sendStream(filePath, request, response, bundle, true);
}

function streamSimulatorJs(filePath, request, response) {
    var b = browserify({paths: getBrowserifySearchPaths()});
    b.add(filePath);

    // Include common modules
    getCommonModules().forEach(function (module) {
        b.require(module.file, {expose: module.name});
    });

    var bundle = b.bundle();
    server.sendStream(filePath, request, response, bundle, true);
}

function streamSimulator(filePath, request, response) {
    // Inject references to simulation HTML files
    var simHostHtmlBasename = PLUGIN_SIMULATION_FILES.SIM_HOST.HTML;
    var pluginHtml = [];
    var pluginLinkTemplate = '<link id="%PLUGINID%-import" rel="import" href="plugin/%PLUGINID%/sim-host.html">';
    pluginList.forEach(function (pluginId) {
        var pluginPath = pluginPaths[pluginId];
        var pluginSimHostHtmlFile = pluginPath && path.join(pluginPath, simHostHtmlBasename);
        if (pluginSimHostHtmlFile && fs.existsSync(pluginSimHostHtmlFile)) {
            pluginHtml.push(pluginLinkTemplate.replace(/%PLUGINID%/g, pluginId));
        }
    });
    server.sendStream(filePath, request, response, fs.createReadStream(filePath).pipe(replaceStream(/<\/\s*head\s*>/, pluginHtml.join('\n') + '</head>')), true);
}

function createScriptDefs(hostType, scriptTypes) {
    return scriptTypes.map(function (scriptType) {
        return {
            comment: {
                'JS': '/** PLUGINS **/',
                'HANDLERS': '/** PLUGIN-HANDLERS **/',
                'CLOBBERS': '/** PLUGIN-CLOBBERS **/'
            }[scriptType],
            exposeId: {
                'JS': '%PLUGINID%',
                'HANDLERS': '%PLUGINID%-handlers',
                'CLOBBERS': '%PLUGINID%-clobbers'
            }[scriptType],
            fileName: PLUGIN_SIMULATION_FILES[hostType][scriptType],
            code: []
        };
    });
}

function streamSimulatorJs2(filePath, request, response) {
    streamHostJsFile(filePath, request, response, 'SIM_HOST', ['JS', 'HANDLERS']);
}


function streamAppHostJs(filePath, request, response) {
    streamHostJsFile(filePath, request, response, 'APP_HOST', ['JS', 'HANDLERS', 'CLOBBERS']);
}

function streamHostJsFile(filePath, request, response, hostType, scriptTypes) {
    var scriptDefs = createScriptDefs(hostType, scriptTypes);

    var b = browserify({paths: getBrowserifySearchPaths()});
    b.transform(function (file) {
        if (file === filePath) {
            var data = ''; return through2(function (buf, encoding, cb) {
                data += buf;
                cb();
            }, function (cb) {
                data = scriptDefs.reduce(function (previousData, scriptDef) {
                    return previousData.replace(scriptDef.comment, scriptDef.code.join(',\n'));
                }, data);
                this.push(data);
                cb();
            });
        } else {
            // No-op for other files
            return through2(function (chunk, encoding, cb) {
                cb(null, chunk);
            });
        }
    });

    b.add(filePath);

    var pluginTemplate = '\'%PLUGINID%\': require(\'%EXPOSEID%\')';
    pluginList.forEach(function (pluginId) {
        var pluginPath = pluginPaths[pluginId];
        if (pluginPath) {
            scriptDefs.forEach(function (scriptDef) {
                var pluginScriptFile = path.join(pluginPath, scriptDef.fileName);
                if (fs.existsSync(pluginScriptFile)) {
                    var exposeId = scriptDef.exposeId.replace(/%PLUGINID%/g, pluginId);
                    scriptDef.code.push(pluginTemplate
                        .replace(/%PLUGINID%/g, pluginId)
                        .replace(/%EXPOSEID%/g, exposeId));
                    b.require(pluginScriptFile, {expose: exposeId});
                }
            });
        }
    });

    var bundle = b.bundle();
    server.sendStream(filePath, request, response, bundle, true);
}

module.exports = {
    handleUrlPath: handleUrlPath,
    streamFile: streamFile,
    init: init
};
