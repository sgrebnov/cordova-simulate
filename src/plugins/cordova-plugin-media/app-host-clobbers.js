/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */

module.exports = {
    // Objects below are required for proper camera plugin loading.
    // Functions implementation is empty, because we have
    // app-host-handlers file which overrides 'Camera.takePicture'
    // exec call handler, so code which invokes these
    // functions is never called.
    Windows: {
        Storage: {
            ApplicationData: {
                current: {}
            },
            CreationCollisionOption: {
                generateUniqueName: function () {}
            },
            FileIO: {},
            Pickers: {
                PickerLocationId: {}
            },
            StorageFile: {
                getFolderFromPathAsync: function () {}
            },
            StorageFolder: {
                getFolderFromPathAsync: function () {}
            }
        },
        Security: {
            Cryptography: {
                CryptographicBuffer: {
                    encodeToBase64String: function () {}
                }
            }
        },
        Media: {
            Capture: {
                MediaStreamType: {}
            }
        },
        UI: {
            WebUI: {
                WebUIApplication: {}
            }
        }
    }
};
