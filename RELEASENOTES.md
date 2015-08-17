<!--
#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#  KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#
-->

# Cordova-simulate Release Notes

### 0.1.3 (Aug 16, 2015)
* Sim host logic for handling `exec` calls now mirrors app host logic ([f9ae6ab](https://github.com/TimBarham/cordova-simulate/commit/f9ae6ab)).
* Renamed `sim-host-controls` files to `sim-host` and `sim-app-host` files to `app-host` ([c9f08c1](https://github.com/TimBarham/cordova-simulate/commit/c9f08c1)).
* Removed unnecessary `html`, `head` and `body` elements from plugin html files ([9848718](https://github.com/TimBarham/cordova-simulate/commit/9848718)).
* Plugin messages no longer support a callback. Added plugin method calls that support a single handler, and a callback (return a promise) ([28173a7](https://github.com/TimBarham/cordova-simulate/commit/28173a7)).
* IE support: No longer use HTML Imports to include plugin UI - instead include plugin HTML when the main sim host page is served ([fbac853](https://github.com/TimBarham/cordova-simulate/commit/fbac853)).
* IE support: Set display to `''` instead of `null` or `'initial'` when un-hiding elements, so dialogs now display ([4d3cc52](https://github.com/TimBarham/cordova-simulate/commit/4d3cc52)).
* IE support: Camera plugin now passes picture as raw binary data, and object URL is created on the app host side (previous approach didn't work in IE) ([57f8689](https://github.com/TimBarham/cordova-simulate/commit/57f8689)).
* IE support: When the server tries to pipe a call from app host to sim host or vice versa, and the target host has not yet connected, it stores the call and makes it when the target ultimately connects ([3dd8539](https://github.com/TimBarham/cordova-simulate/commit/3dd8539)).

### 0.1.2 (Aug 5, 2015)
* Readme updates (including corrected install instructions) ([75159a1](https://github.com/TimBarham/cordova-simulate/commit/75159a1)).
* Fix for error when cordova is installed locally to the app ([117fb42](https://github.com/TimBarham/cordova-simulate/commit/117fb42)).
* Added `RELEASENOTES.md` ([cf99271](https://github.com/TimBarham/cordova-simulate/commit/cf99271)).

### 0.1.1 (Aug 4, 2015)
* Updated styling.
* Added `Events` panel.
* Added `Geolocation` panel.
* Fixed security issue that blocked web socket connections with newer Cordova apps.
* Support for 'clobber' functionality in app host (allow plugins to clobber built in JavaScript objects).
* Added `Accelerometer` panel (device motion plugin).
* Now prepares target platform on launch (but not yet on refresh).
* Adds `Unhandled Exec Call` dialog and `Persisted Exec Responses` panel.
* Supports `Globalization` API.


### 0.1.0 (May 24, 2015)
* Initial release with basic functionality