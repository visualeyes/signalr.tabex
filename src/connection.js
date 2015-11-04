/* eslint id-length: 1 */
import tabex from 'tabex';
import $ from 'jquery';

import channelHandler from 'channel-handler';

const SYS_NSPACE = 'signalr.sys.';
const INVOKE_EVT_NAME = `${SYS_NSPACE}.invoke`;

const messageBus = tabex.client();

let isMaster = false;
let isConnected = false;
let connection = null;

function getSysEvtName(name) {
  return SYS_NSPACE + name;
}

function emitConnectionStatus(includeSelf) {
  if (!isMaster) return;
  messageBus.emit(getSysEvtName('connectionstatus'), { isConnected: isConnected }, includeSelf);
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

    connection.received(function(message) {
      channelHandler.processSignalRMessage(connection, messageBus, message);
    });

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
messageBus.on(INVOKE_EVT_NAME, function(message) {
  if (!isMaster) return;
  channelHandler.sendInvokeMessage(connection, message);
});

export default {
  INVOKE_EVT_NAME,
  getMessageBus() {
    return messageBus;
  },
};
