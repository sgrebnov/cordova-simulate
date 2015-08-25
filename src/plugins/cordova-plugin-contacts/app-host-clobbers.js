/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * 'License'); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */

module.exports = {
    // This variable is required on Windows platform so that plugin works
    Windows: {
        ApplicationModel: {
            Contacts: {}
        }
    },
    WinJS: {
        Utilities: {
            // While simulating Windows platform, we don't currently provide
            // a way to specify Table/PC vs Phone simulation so we always
            // retun false here; this may be changed in the future.
            isPhone: false
        }
    }
};
