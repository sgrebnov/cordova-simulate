A browser based plugin simulation tool to aid development and testing of Cordova applications.

#Installation

```
npm install -g cordova-simulator
```

#Usage
From the command line anywhere within a Cordova project, enter the following:

```
simulate [<platform>] [--target=<browser>] 
```

Where:

* **platform** is any Cordova platform that has been added to your project. If no platform is specified, the browser
  platform will be used.
* **browser** is the name of the browser to launch your app in. Can be any of the following: `chrome`, `chromium`,
  `firefox`, `ie`, `opera`, `safari`.  

#What it does

Cordova simulator will launch your app in the browser, and open a second browser window displaying UI that allows you to
control how plugins in your application work.

This preview version includes built-in support for the camera (`org.apache.cordova.camera` or `cordova-plugin-camera`)
and device (`org.apache.cordova.device` or `cordova-plugin-device`) plugins, but also allows for plugins to define their
own UI. To add simulation support to a plugin, follow these steps:

1. Clone the `cordova-simulator` git repository (`git clone https://github.com/TimBarham/cordova-simulator.git`), as it
   contains useful example code (see `src/plugins`).
2. Add your plugin UI code to your plugin in `src/simulation`. There must be a file called `sim-host-controls.html`,
   which defines the UI to display in the simulation window, and there can also be supporting js, css and image files
   which it references.
