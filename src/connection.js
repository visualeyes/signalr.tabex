/* eslint id-length: 1 */
import tabex from 'tabex';
import jquery from 'jquery';

import Helpers from './helpers';
import HubHelper from './hub.helper';

const SYS_NSPACE = 'signalr.sys.';
const HUB_NSPACE = 'signalr.';
const INVOKE_EVT_NAME = `${SYS_NSPACE}.invoke`;

const messageBus = tabex.client();

let isMaster = false;
let isConnected = false;
let connection = null;

function getSysEvtName(name) {
  return SYS_NSPACE + name;
}

function getHubEvtName(hubName, evtName) {
  return `${HUB_NSPACE}.${hubName}.${evtName}`;
}

function emitConnectionStatus(includeSelf) {
  if (!isMaster) return;
  messageBus.emit(getSysEvtName('connectionstatus'), { isConnected: isConnected }, includeSelf);
}

function onRecieivedData(minData) {
  if (!minData) return;

  if (typeof (minData.I) !== 'undefined') {
    // We received the return value from a server method invocation, look up callback by id and call it
    const dataCallbackId = minData.I.toString();

    const result = HubHelper.maximizeInvokeResponse(minData);

    if (result.progress) {
      // do nada
    } else if (result.error) {
      connection.log(dataCallbackId + ' failed to execute.');
    } else {
      connection.log('Invoked ' + dataCallbackId);
    }
  } else {
    const data = HubHelper.maximizeEvtMessage(minData);
    connection.log(`Triggering client hub event ${data.method} on hub ${data.hub}.`);
    const evt = getHubEvtName(data.hub, data.method);
    messageBus.emit(evt, data, true);
  }
}

function onInvokeHub(message) {
  if (!isMaster) return;

  if (!message.hub || !message.method) {
    throw new Error('Hub or Method to invoke not set');
  }

  let args = [];

  if (message.args) {
    args = Helpers.isArray(message.args) ? message.args : [message.args];
  }

  const invokeId = message.hub + '.' + message.method;
  const data = { H: message.hub, M: message.method, A: args, I: invokeId };

  connection.log('Invoking ' + invokeId);
  connection.send(data);
}


function createConnection(signalRUrl, logging) {
  if (!connection) {
    connection = $.connection(signalRUrl);

    connection.logging = !!logging;

    connection.connectionSlow(function() {
      messageBus.emit(getSysEvtName('slow'), {}, true);
      connection.log('Signalr connection is slow.');
    });

    connection.error(function(error) {
      connection.log('SignalR error: ' + error);
    });

    connection.received(onRecieivedData);

    connection
    .start(function() {
      connection.log(`Now connected, connection ID=${connection.id}`);
      isConnected = true;
      emitConnectionStatus(true);
    })
    .fail(function() {
      connection.log('Could not connect');
      isConnected = false;
      emitConnectionStatus(true);
    });
  }
}

function masterChange(data) {
  isMaster = data.node_id === data.master_id;

  if (isMaster && !connection) {
    createConnection();
    return;
  }

  if (!isMaster && connection) {
    connection.stop();
    isConnected = false;
    connection = null;
  }
}

messageBus.on('!sys.master', masterChange);
messageBus.on(INVOKE_EVT_NAME, onInvokeHub);

export default {
  INVOKE_EVT_NAME,
  getHubEvtName,
  getMessageBus() {
    return messageBus;
  },
};
