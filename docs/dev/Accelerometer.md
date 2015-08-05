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

# cordova-plugin-device-motion

###Tilt angles (alpha/beta/gamma) - hide them?

Looking at the simulator panel – the alpha, beta and gamma values are displayed
but aren't reported back so can confuse users. Those values are tilt angles and
could be treated as an alternative representation for acceleration
(if device is NOT moving) and could be calculated from x, y, z).


Alpha is currently required to understand device position when you rotate device
using graphical representation (there is also Shift key to change it) 

We may want to re-use Windows Phone emulator graphical representation idea,
where you first select device position from some pre-defined positions and
then rotate it.

### Report interval

According to current implementation report interval is hardcoded (50ms) and values
are constantly sent from simulator window to host.

Geolocation is implemented differently - values are reported from host script
(not from simulator) and simulator window only sends position update when it is
really happened.
We may want to review which approach is better and if there are any recomendations
based on performance/etc considerations.
