# Inter-component communication mechanism

## Who should read this document

    1. `cordova-simulate` developers;

    2. plugin developers who want to add simulation support to their plugins.

## General description of the communication workflow

`cordova-simulate` starts and stops all the components and mediates
connectivity between them. Each component after the start connect to
`cordova-simulate`, discover its peer, and connect to it. 

`cordova-simulate` provides built-in facilities for communication between the
components. To communicate with its peer, a component interacts with a local
JavaScript object by calling its functions and accessing its properties. In
order to enable this communication, the component must "publish" the API in a
declarative fashion, this API is then created as a local object mentioned
above on its peer.

For example, a declaration of a function by a component would look like
following:

```javascript
// IN THE COMPONENT EXPOSING API

var foocomm = wsrpc.init('foo-channel');

function bar(x) {
    // implementation of setX, e.g. trigger an event in app-host.
    return x;
}

foocomm.on('peer-on', function () {
    foocomm.publish({
        method: "bar",  // name of the function to be exposed, optional
        params: [       // description of the parameters
            {
                        // name and description are optional, used for debugging
                name: "x",
                description: "a new x value",
                type: "number"
            }
        ],
        return: {       // description of the return value
            type: "number"
        },
        handler: bar
    });
});
```

The component peer would call the function as if it was local:

```javascript
// IN THE COMPONENT CONSUMING API
var foo,
    foocomm = wsrpc.init('foo-channel');

foocomm.on('peer-publish', function (peer) {
    foo = peer;
    // call foo.bar as if it was local
    foo.bar(10, function (err, val) {
        if (!err) {
            // success, the val is 10!
        }
    });
});

```

`cordova-simulate` monitors the lifecycle of the component and notifies the
component of any changes via a set of well-defined events.

The details of the lifecycle, the call protocol and component implementation
guidelines are discussed in this document.

## Terminology

Term | Meaning
-----|---------
The component | Generally refers to "this" component as opposed to its peer. See `Peer`.
Peer | The `cordova-simulate` component this component is communicating to. Each communication is peer-to-peer in its nature.
Channel | A discovery mechanism for components to connect to each other. Components connect to each other by joining a channel.

> Note: 1-to-many communication may be supported in the future.

## Communication lifecycle

A component must manage two categories of connectivity events: its own
connection status and its connectivity to its peer.

### Monitoring own lifecycle

A component is started and managed by `cordova-simulate`. Component must
explicitly initialize the communication subsystem. It must be aware if it has
connected, disconnected, or if there was an error in underlying communication.
`cordova-simulate` exposes a global object `wsrpc` which triggers the
correponding events.

#### Initialization: `wsrpc.init`

Component must call init to initialize the communication subsystem. Component
must specify the channel to which it wishes connect to. The component and its
peer connect by specifying the same channel name, e.g.:

```javascript
// This example assumes the component is sim-host
var uicomm = wsrpc.init('cordova-plugin-foo-sim-ui');
```

> Note: the API function names and their signatures as well as the names of the
> global objects are draft
>
> TODO: instead of overloading the semantics of channel name, we could define
> "roles", such as the init would look like
> `wsrpc.init('cordova-plugin-foo', 'sim-host', 'ui-host');`. Meaning "I'm
> component `sim-host` waiting for `ui-host` on `cordova-plugin-foo` channel".

#### `open` event

This event is triggered when the connection is established.

```javascript
uicomm.on('open', function () {
    // update connectivity status in the UI
}
```
#### `close` event

This event is triggered when the connection is closed. No communication is
possible after this event is received.

```javascript
uicomm.on('close', function () {
    // disable interaction with the UI elements
});
```

### Interacting with the peer

Since each of the components may reside in a separate runtime (browser or
node.js instance) with its own abritrary lifecycle, a component willing to
establish communication should not assume that at any given moment the peer is
available. Instead, it should observe the lifecycle of its peer by listening to
events.

Peer can connect and disconnect multiple times during the lifespan of the
component.

#### Publishing the API: `wsrpc.publish`

Both the component and its peer can publish and consume each other's API. The
API is published declaratively as a JSON object with the following structure:

```javascript

function foo(x) {
    // implementation
    return x + "";
}

var myAPI = {
    methods: [
        {
            "method": "foo",
            "params": [
                {
                    "name": "x",
                    "description": "new value of x",
                    "type": "number"
                }
            ],
            "return": {
                "description": "new value of x as string",
                "type": "string"
            }
            "hanlder": foo // actual function reference
        }
    ]
};
```

> Note: publishing of the properties "bound" to local variables is also
> supported, but not yet documented

It can then be published like follows:

```javascript
uicomm.on('peer-on', function () {
    uicomm.publish(myAPI);
});
```

The peer will recieve `peer-publish` event after it connects:

```javascript
var sim,
    simcomm;
simcomm = wsrpc.init('cordova-plugin-foo-sim-ui');

simcomm.on('peer-publish', function (peer) {
    sim = peer;
    // at this point in time, sim can be used
    sim.foo(10, function (err, val) {
        if (!err) {
            // success!!! 
            // val === "10" returns true
        }
    });
});

```

> Note: the peer using the API can "promisify" the functions. See, for example: [bluebird promisification](https://github.com/petkaantonov/bluebird/blob/master/API.md#promisification)

#### `peer-on` event

This event is triggered when the other peer joins the channel. The component
should publish its API at this time if needed.

```javascript

var sim; // reference to the sim-host component

simcomm.on('peer-on', function (peer) {
    // peer object is the main object to interact with, save the reference
    sim = peer;
    // publish the API
    simcomm.publish(uiAPI);
    
});
```

Until the API is published, a function call on peer would return an error to its callback.

#### `peer-publish` event

This event is triggered when the peer publishes the API. The handler recieves an
object which encapsulates the API published by the peer.

```javascript
simcomm.on('peer-publish', function (peer) {
    sim = peer;
    // at this point in time, sim can be used
    sim.foo(10, function (err) {
        if (!err) {
            // success!!!
        }
    });
});
```

The reference to the currently connected peer could also be retrieved using
`simcomm.getPeer()` later.

#### `peer-off` event

Triggered when the peer disconnects.

```javascript
simcomm.on('peer-off', function () {
    sim = undefined;
});
```

