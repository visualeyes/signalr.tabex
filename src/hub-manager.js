import Connection from './connection';
import channelHandler from 'channel-handler';

const messageBus = Connection.getMessageBus();

function createHub(hubname) {
  return {
    invoke(method, args) {
      messageBus.emit(Connection.INVOKE_EVT_NAME, {
        hub: hubname,
        method: method,
        args: args,
      }, true);
    },

    listen(evtName, callback) {
      return messageBus.on(channelHandler.getHubEvtName(hubname, evtName), function(message) {
        callback.apply(null, message.args);
      });
    },
  };
}

export default {
  createHub,
};
