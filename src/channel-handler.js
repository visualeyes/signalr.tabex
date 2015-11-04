import Helpers from './helpers';
import HubHelper from './hub-helper';

const HUB_NSPACE = 'signalr';

function getHubEvtName(hubName, evtName) {
  if (!hubName) throw new Error('hubName is required');
  if (!evtName) throw new Error('evtName is required');

  return `${HUB_NSPACE}.${hubName}.${evtName}`;
}

function sendInvokeMessage(connection, message) {
  if (!connection) throw new Error('connection is required');
  if (!message) throw new Error('message is required');

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

function processSignalRMessage(connection, messageBus, minData) {
  if (!connection) throw new Error('connection is required');
  if (!messageBus) throw new Error('connection is required');
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

export default {
  getHubEvtName,
  sendInvokeMessage,
  processSignalRMessage,
};
