# `cordova-simulate` components

In order to make the simulation environment easily reusable (e.g. by an
integrated development environments) and to enable its use in automated
testing, `cordova-simulate` defines and implements components, format, and
communication mechanisms so that a plugin developer could implement simulation
support for a plugin in an efficient (both time- and code-size-wise) fashion.

An application simulation environment logically consists of three primary
components:

1. `app-host`: a container where the application is loaded, rendered, and
executed.

2. `sim-host`: a module which is responsible for executing simulation support
for a Cordova plugin. In particular:

    a. responsible for handling `cordova.exec()` calls inflicted by executing
    an Cordova application in `app-host`.

    b. processing and transmitting events to `app-host` inflicted by the
    `ui-host` (i.e. responding to the user actions,see #3) or any other
    component (e.g. test driver) causing changes to the plugin state.

3. `ui-host`: a module which is responsible providing a graphical UI to change
the plugin state and interactively drive the application execution.

## Component interaction

The components follow the following interaction scheme:

```
    app-host <---> sim-host <---> ui-host
```

`cordova-simulate` defines a communication scheme and API for each of these
components to interact.

The interaciton between `app-host` and `sim-host` in many ways is similar to
the interaction between JavaScript portion of the plugin and its native
implementation. `app-host` ensures that a plugin `cordova.exec()` calls are
dispatched to the module providing simulation support for the corresponding
plugin.  `sim-host` communicates to `app-host` the events and the associated
parameters when the plugin necessary (e.g. when the plugin state changes),
these events are then triggered to the application.

`sim-host`, in turn, communicates with the `ui-host`. `ui-host` enables user
interaction with the plugin state and, thus, with the application. `sim-host`
exposes an API (a set properties and functions) for the `ui-host` to operate
on. When user interacts with the UI (e.g. sets battery charge level), `ui-host`
uses the interface to put `sim-host` in the corresponding state which, in turn,
is transmitted to the `app-host` and, finally, to the application being simulated.
In case, an action had a side-effect, `sim-host` may send an event to
`ui-host`, containing the new state of the plugin. Details of this interaction
are described in `Sim-UI-communication.md`.

`ui-host` does not necessarily have to expose a UI. It could well be a script
implementing a test scenario or replaying a previously recorded plugin
behavior.

## Component placement

The components should not necessarily be placed in separate JavaScript
runtimes. `cordova-simulate` make specific choice of their placement, however,
another implemenation may chose to load components differently. For example,
`sim-host` could be loaded in and executed in the main browser `window` while
`app-host` is loaded and executed in an iframe in that `window` and `ui-host`
is loaded and executed in another iframe in the same window.

`cordova-simulate` does not guarantee that different component placement is a
configuration-only setting, some changes to the code (e.g. HTML documents)
could be required. Loading `app-host` and `ui-host` (both require access to the
document's DOM) in the same `window` is not supported.

