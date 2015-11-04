const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();
const path = require('path');

const messageBus = require(path.join(__dirname, 'messagebus.helper'))
const connection = require(path.join(__dirname, 'connection.helper'))
let channelHandler = require(path.join(__dirname, '..', 'src/channel.handler'));


describe('channelHandler', () => {
  beforeEach(function() {
    connection.clearLastData();
  });

  describe('#getHubEvtName', () => {
    it('throws if arguments invalid', () => {
      () => { channelHandler.getHubEvtName(null, 'test') }.should.throw(Error);
      () => { channelHandler.getHubEvtName('test', null) }.should.throw(Error);
    });

    it('creates hub name', () => {
      channelHandler.getHubEvtName('hub', 'method').should.equal('signalr.hub.method');
    });

  });
  describe('#sendInvokeMessage', () => {
    it('throws if arguments invalid', () => {
      () => { channelHandler.sendInvokeMessage(null) }.should.throw(Error);
      () => { channelHandler.sendInvokeMessage({}, null) }.should.throw(Error);
    });

    it('throws if no hub on message', () => {
      () => {
        channelHandler.sendInvokeMessage({}, {
          hub: {},
          method: null
        })
      }.should.throw(Error);
      () => {
        channelHandler.sendInvokeMessage({}, {
          hub: null,
          method: {}
        })
      }.should.throw(Error);
    });

    it('sends data with null args', () => {
      channelHandler.sendInvokeMessage(connection, {
        hub: 'hub',
        method: 'method',
        args: null
      });

      let lastData = connection.getLastSentData();
      lastData.H.should.equal('hub');
      lastData.M.should.equal('method');
      lastData.I.should.equal('hub.method');
      assert.deepEqual(lastData.A, []);
    });
    it('sends data with item args', () => {
      channelHandler.sendInvokeMessage(connection, {
        hub: 'hub',
        method: 'method',
        args: 1
      });

      let lastData = connection.getLastSentData();
      lastData.H.should.equal('hub');
      lastData.M.should.equal('method');
      lastData.I.should.equal('hub.method');
      lastData.A[0].should.equal(1);

    });
    it('sends data with array args', () => {
      channelHandler.sendInvokeMessage(connection, {
        hub: 'hub',
        method: 'method',
        args: [1]
      });

      let lastData = connection.getLastSentData();
      lastData.H.should.equal('hub');
      lastData.M.should.equal('method');
      lastData.I.should.equal('hub.method');
      lastData.A[0].should.equal(1);
    });
  });


  describe('#processSignalRMessage', () => {

      it('throws if arguments invalid', () => {
        () => { channelHandler.processSignalRMessage(null, {}, null) }.should.throw(Error);
        () => { channelHandler.processSignalRMessage({}, null, null) }.should.throw(Error);
        () => { channelHandler.processSignalRMessage({}, {}, null) }.should.not.throw(Error);
      });

      it('processes invoke progress response', () => {
        channelHandler.processSignalRMessage(connection, messageBus, {
          I: 'hub.method',
          progress: { id: 'id', data: 'data' }
        });

        let lastEmit = messageBus.getLastEmit();
        assert.isNull(lastEmit);
      });
      it('processes invoke error response', () => {
        channelHandler.processSignalRMessage(connection, messageBus, {
          I: 'hub.method',
          error: 'error'
        });

        let lastEmit = messageBus.getLastEmit();
        assert.isNull(lastEmit);
      });

      it('processes invoke progress response', () => {
        channelHandler.processSignalRMessage(connection, messageBus, {
          I: 'hub.method',
        });

        let lastEmit = messageBus.getLastEmit();
        assert.isNull(lastEmit);
      });
      it('processes invoke message response', () => {
        channelHandler.processSignalRMessage(connection, messageBus, {
          H: 'hub',
          M: 'method',
          A: null,
          S: null,
        });

        let lastEmit = messageBus.getLastEmit();
        lastEmit.name.should.equal('signalr.hub.method');
        assert.deepEqual(lastEmit.data, { hub: 'hub', method: 'method', args: null, state: null, });
        lastEmit.toSelf.should.equal(true);
      });
  });
});
