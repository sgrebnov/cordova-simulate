var Q = require('q'),
    fs = require('fs'),
    exec = require('child_process').exec,
    cordova_serve = require('cordova-serve'),
    server = require('./server');

var platform,
    target;

module.exports = function (args) {
    var urlRoot,
        startPage;

    processArgs(args);

    server.setPlatform(platform);

    prepare(platform).then(function () {
        return cordova_serve.servePlatform(platform, {
            noServerInfo: true,
            urlPathHandler: server.handleUrlPath,
            streamHandler: server.streamFile,
            serverExtender: server.init
        });
    }).then(function (serverInfo) {
        urlRoot = 'http://localhost:' + serverInfo.port + '/';
        startPage = parseStartPage();
        server.log('Server started:\n- App running at: ' + urlRoot + startPage + '\n- Sim host running at: ' + urlRoot + 'simulator/index.html');
        return cordova_serve.launchBrowser({target: target, url: urlRoot + startPage});
    }).then(function () {
        return cordova_serve.launchBrowser({target: target, url: urlRoot + 'simulator/index.html'});
    });
};

function prepare(platform) {
    var d = Q.defer();

    server.log('Preparing platform \'' + platform + '\'.');
    exec('cordova prepare ' + platform, function (err, stdout, stderr) {
        if (err) {
            stderr = stderr || 'Verify \'' + platform + '\' platform has been added to the project.'
            server.error('Call to \'cordova prepare\' failed.\n' + stderr);
            d.reject(err);
        } else {
            d.resolve();
        }
    });

    return d.promise;
}

function parseStartPage() {
    // Start Page is defined as <content src="some_uri" /> in config.xml
    // TODO: Once cordova-serve has been updated to provide the project root directory, use that here.
    if (fs.existsSync('config.xml')) {
        var startPageRegexp = /<content\s+src\s*=\s*"(.+)"\s*\/>/ig,
            configFileContent = fs.readFileSync('config.xml');

        var match = startPageRegexp.exec(configFileContent);
        if (match) {
            return match[1];
        }
    }

    return 'index.html'; // default uri
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
