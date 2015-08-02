var Q = require('q'),
    exec = require('child_process').exec,
    cordova_serve = require('cordova-serve'),
    server = require('./server');

var platform,
    target;

module.exports = function (args) {
    var urlRoot;

    processArgs(args);

    prepare(platform).then(function () {
        return cordova_serve.servePlatform(platform, {
            urlPathHandler: server.handleUrlPath,
            streamHandler: server.streamFile,
            serverExtender: server.init
        });
    }).then(function (serverInfo) {
        urlRoot = 'http://localhost:' + serverInfo.port + '/';
        return cordova_serve.launchBrowser({target: target, url: urlRoot + 'index.html'});
    }).then(function () {
        return cordova_serve.launchBrowser({target: target, url: urlRoot + 'simulator/index.html'});
    });
};

function prepare(platform) {
    var d = Q.defer();

    console.log('Preparing platform \'' + platform + '\'.');
    exec('cordova prepare ' + platform, function (err, stdout, stderr) {
        if (err) {
            stderr = stderr || 'verify \'' + platform + '\' platform has been added to the project.'
            console.error('Call to \'cordova prepare\' failed: ' + stderr);
            d.reject(err);
        } else {
            d.resolve();
        }
    });

    return d.promise;
}

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
