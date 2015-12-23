/* eslint id-length: 1 */

import tabex from 'tabex';
import jquery from 'jquery';

import channelHandler from './channel-handler';

const SYS_NSPACE = 'signalr.sys.';
const ENSURE_STARTED_EVT_NAME = `${SYS_NSPACE}.ensurestarted`;
const INVOKE_EVT_NAME = `${SYS_NSPACE}.invoke`;
const REGISTERHUB_EVT_NAME = `${SYS_NSPACE}.registerhub`;

function connectionFactory(hubname, signalRUrl) {
  const messageBus = tabex.client();
  const hubs = {};

  messageBus.emit(REGISTERHUB_EVT_NAME, hubname, false); // ensure other tabs register the hub

  function registerHub(hubName) {
    hubs[hubName] = true; // registers the hub
  }

  registerHub(hubname);

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

  function startConnection() {
    if (connection && connection.state === jquery.signalR.connectionState.disconnected) {
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

  function createConnection(logging) {
    if (!connection) {
      connection = jquery.connection(signalRUrl);

      connection.logging = !!logging;

      connection.starting(() => {
        const monitoredHubs = [];

        jquery.each(hubs, (key) => {
          monitoredHubs.push({ name: key });
          connection.log('Client subscribed to hub "' + key + '".');
        });

        connection.data = connection.json.stringify(monitoredHubs);
      });

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

      startConnection();
    }
  }

  function masterChange(data) {
    isMaster = data.node_id === data.master_id;

    if (isMaster && !connection) {
      createConnection(true);
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

  messageBus.on(REGISTERHUB_EVT_NAME, registerHub);

  messageBus.on(ENSURE_STARTED_EVT_NAME, startConnection);

  return messageBus;
}

const messageBusses = {};

export default {
  ENSURE_STARTED_EVT_NAME,
  INVOKE_EVT_NAME,
  REGISTERHUB_EVT_NAME,
  getMessageBus(hubname, url) {
    if (!messageBusses[url]) {
      messageBusses[url] = connectionFactory(hubname, url);
    }

    const messageBus = messageBusses[url];

    return messageBus;
  },
};
