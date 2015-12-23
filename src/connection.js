/* eslint id-length: 1 */

import tabex from 'tabex';
import jquery from 'jquery';

import channelHandler from './channel-handler';

const SYS_NSPACE = 'signalr.sys.';
const INVOKE_EVT_NAME = `${SYS_NSPACE}.invoke`;

function connectionFactory(signalRUrl) {
  const messageBus = tabex.client();

  let isMaster = false;
  let isConnected = false;
  let connection = null;

  function getSysEvtName(name) {
    return SYS_NSPACE + name;
  }

  function emitConnectionStatus(includeSelf) {
    if (!isMaster) return;
    messageBus.emit(getSysEvtName('connectionstatus'), {
      isConnected: isConnected,
    }, includeSelf);
  }

  function createConnection(logging) {
    if (!connection) {
      connection = jquery.connection(signalRUrl);

      connection.logging = !!logging;

      connection.connectionSlow(() => {
        messageBus.emit(getSysEvtName('slow'), {}, true);
        connection.log('Signalr connection is slow.');
      });

      connection.error((error) => {
        connection.log('SignalR error: ' + error);
      });

      connection.received((message) => {
        channelHandler.processSignalRMessage(connection, messageBus, message);
      });

      connection
      .start(() => {
        connection.log(`Now connected, connection ID=${connection.id}`);
        isConnected = true;
        emitConnectionStatus(true);
      })
      .fail(() => {
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
  messageBus.on(INVOKE_EVT_NAME, (message) => {
    if (!isMaster) return;
    channelHandler.sendInvokeMessage(connection, message);
  });

  return messageBus;
}

const messageBusses = {};

export default {
  INVOKE_EVT_NAME,
  getMessageBus(url) {
    if (!messageBusses[url]) {
      messageBusses[url] = connectionFactory(url);
    }

    return messageBusses[url];
  },
};
