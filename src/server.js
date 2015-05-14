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

var combined_stream = require('combined-stream'),
    fs              = require('fs'),
    https           = require('https'),
    path            = require('path'),
    server          = require('cordova-serve');

var pluginPaths = [];

function init(server, root) {
    var io = require('socket.io')(server);

    this.server = server;
    this.io = io;

    var app_host_socket;
    var simulation_host_socket;

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

            socket.on('get-plugin-list', function (data, callback) {
                var pluginPath = path.resolve(root, 'plugins');
                fs.exists(pluginPath, function (exists) {
                    if (exists) {
                        fs.readdir(pluginPath, function (err, files) {
                            var folders = [];
                            if (files && !err) {
                                files.forEach(function (file) {
                                    if (fs.statSync(path.join(pluginPath, file)).isDirectory()) {
                                        folders.push(file);
                                    }
                                });
                            }
                            callback(folders);
                        });
                    } else {
                        callback([]);
                    }
                });
            });

            socket.on('get-plugin-info', function (pluginId, callback) {
                var pluginHtmlFileName = 'sim-host-controls.html';
                var pluginPath = pluginPaths[pluginId];
                var pluginPathExists = false;

                if (pluginPath) {
                    pluginPathExists = pluginPath !== '<none>';
                    if (pluginPathExists) {
                        pluginPath = path.resolve(pluginPath, pluginHtmlFileName);
                    }
                } else {
                    // We get plugin files from <root project dir>/plugins, rather than from the browser platform.
                    // Simulation files shouldn't be included with the app, so shouldn't be included by config.xml and
                    // copied into the browser platform.
                    var pathArray = root.split(path.sep);
                    var pluginsDir = pathArray.slice(0, pathArray.lastIndexOf('platforms')).concat('plugins').join(path.sep);
                    var pluginDir = path.resolve(pluginsDir, pluginId, 'src/simulation');
                    pluginPath = path.resolve(pluginDir, pluginHtmlFileName);

                    if (!fs.existsSync(pluginPath)) {
                        // There was on simulation UI defined for this plugin. See if we have our own UI defined.
                        pluginDir = path.resolve(__dirname, 'plugins', pluginId);
                        pluginPath = path.resolve(pluginDir, pluginHtmlFileName);
                    }
                    pluginPathExists = fs.existsSync(pluginPath);
                    if (pluginPathExists) {
                        pluginPaths[pluginId] = pluginDir;
                    } else {
                        pluginPaths[pluginId] = '<none>';
                    }
                }

                // We provide an href for the simulation host to use when processing this html (for resolving script and
                // img references, for example).
                var href = 'simulator/plugin/' + pluginId + '/' + pluginHtmlFileName;
                var returnValue = {href: href, html: ''};

                if (pluginPathExists) {
                    fs.readFile(pluginPath, 'utf8', function (err, html) {
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
        console.log('SERVER EMITTING TO SIMULATION HOST');
        emitToHosts(simulation_host_socket, msg, data, callback);
    }

    function emitToAppHost(msg, data, callback) {
        console.log('SERVER EMITTING TO APP HOST');
        emitToHosts(app_host_socket, msg, data, callback);
    }

    function emitToHosts(host, msg, data, callback) {
        console.log('- msg: ' + msg);

        if (host) {
            host.emit(msg, data, callback);
        }
    }
}

function processUrlPath(urlPath, request, response, do302, do404) {
    // Possible return values:
    // 1. {filePath: value}: If value is a non-empty string, this will be the full qualified path the caller should use.
    //    Otherwise, if value is falsy, we have done no processing and the caller should determine the file path.
    // 2. null: We have handled the request - caller should do no more.

    if (urlPath.indexOf('/simulator/') === 0) {
        // The requested file should be handled by the simulator

        var splitPath = urlPath.split('/');

        // Remove the empty first element
        splitPath.shift();

        // Remove 'simulator'
        splitPath.shift();

        var filePath;
        if (splitPath[0] === 'plugin') {
            // Remove 'plugin'
            splitPath.shift();

            var pluginId = splitPath.shift();
            filePath = splitPath.join('/');

            var pluginPath = pluginPaths[pluginId];
            filePath = pluginPath && pluginPath !== '<none>' ? path.resolve(pluginPath, filePath) : null;

            return {filePath: filePath};
        }

        filePath = splitPath.join('/');
        if (filePath === 'index.html') {
            // Allow 'index.html' as a synonym for 'simulate.html'
            filePath = 'simulate.html';
        }
        return {filePath: path.join(__dirname, 'simulator-host', filePath)};
    }

    return {filePath: null};
}

function streamFile(filePath, request, response) {
    if (request.url === '/cordova.js') {
        var readStream = combined_stream.create();
        https.get('https://cdn.socket.io/socket.io-1.2.0.js', function (res) {
            readStream.append(res);
            readStream.append(fs.createReadStream(path.join(__dirname, 'app-host.js')));
            readStream.append(fs.createReadStream(filePath));
            server.sendStream(filePath, request, response, readStream);
        });

        return true;
    }
    return false;
}

module.exports = {
    processUrlPath: processUrlPath,
    streamFile: streamFile,
    init: init
};
