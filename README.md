# signalr.tabex
[![Build status](https://travis-ci.org/visualeyes/signalr.tabex.svg)](https://travis-ci.org/visualeyes/signalr.tabex.svg)

SignalR Client using tabex

````js
import HubManager  from 'signalr-tabex'

const fooHub = HubManager.createHub('foo');

fooHub.listen('bar', (arg1) => {
  console.log(arg1);
});

fooHub.invoke('baz', arg1);
fooHub.invoke('baz', [arg1, arg2]);

````
