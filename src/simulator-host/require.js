var Require = (function () {
    var modules = {};

    function registerModule(pluginId, moduleId, module) {
        console.log('Require.registerModule(pluginId: ' + pluginId + ', moduleId: ' + moduleId + ') module:');
        console.log(module);
        modules[pluginId] = modules[pluginId] || {};
        modules[pluginId][moduleId] = module;
    }

    function require(pluginId, moduleId) {
        console.log('require(pluginId: ' + pluginId + ', moduleId: ' + moduleId + ')');
        return modules[pluginId] && modules[pluginId][moduleId] || null;
    }

    return {
        registerModule: registerModule,
        require: require
    };
})();
