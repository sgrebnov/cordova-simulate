var cordova_serve = require('cordova-serve'),
    server = require('./server');

var platform,
    target;

module.exports = function (args) {
    var urlRoot;

    processArgs(args);

    // Launch the server with our handlers
    cordova_serve.servePlatform({
        platform: platform,
        urlPathProcessor: server.processUrlPath,
        streamHandler: server.streamFile,
        serverExtender: server.init
    }).then(function (serverInfo) {
        urlRoot = 'http://localhost:' + serverInfo.port + '/';
        return cordova_serve.launchBrowser(target, urlRoot);
    }).then(function () {
        return cordova_serve.launchBrowser(target, urlRoot + 'simulator/index.html');
    });
};

function processArgs(args) {
    platform = null;
    target = null;

    args.shift(); // Remove 'node'
    args.shift(); // Remove 'simulate'

    args.forEach(function (arg) {
        arg = arg.toLowerCase();
        if (arg.indexOf('--target=') === 0) {
            if (target) {
                throw new Error('Target defined more than once');
            }
            target = arg.substring(9);
        } else {
            if (platform) {
                throw new Error('Too many arguments');
            }
            platform = arg;
        }
    });

    platform = platform || 'browser';
    target = target || 'chrome';
}