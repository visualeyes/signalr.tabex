import Connection from './connection';
import channelHandler from './channel-handler';


function createHub(hubname, url) {
  const messageBus = Connection.getMessageBus(hubname, url);

  messageBus.emit(Connection.ENSURE_STARTED_EVT_NAME, {}, true);

  return {
    invoke(method, args) {
      messageBus.emit(Connection.INVOKE_EVT_NAME, {
        hub: hubname,
        method: method,
        args: args,
      }, true);
    },

    listen(evtName, callback) {
      return messageBus.on(channelHandler.getHubEvtName(hubname, evtName), (message) => {
        callback.apply(null, message.args);
      });
    },
  };
}

export default {
  createHub,
};
