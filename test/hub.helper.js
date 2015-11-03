
const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();
const path = require('path');

let Helpers = require(path.join(__dirname, '..', 'src/hub.helper'));

describe('Helpers', () => {
  describe('#maximizeInvokeResponse', () => {
    function getMinData(includeProgress) {
      return {
        S: 'state',
        R: 'result',
        P: includeProgress ? {
          I: 'id',
          D: 'data',
        } : null,
        I: 'id',
        H: 'isHubException',
        E: 'error',
        T: 'stackTrace',
        D: 'errorData',
      };
    }

    function assertExpanded(result, includeProgress) {

      result.state.should.equal('state');
      result.result.should.equal('result');

      if(includeProgress) {
        result.progress.should.not.equal(null);
        result.progress.id.should.equal('id');
        result.progress.data.should.equal('data');
      } else {
        assert.isNull(result.progress);
      }

      result.id.should.equal('id');
      result.isHubException.should.equal('isHubException');
      result.error.should.equal('error');
      result.stackTrace.should.equal('stackTrace');
      result.errorData.should.equal('errorData');
    }

    it('expands correctly', () => {
      let minData = getMinData(true);
      let result = Helpers.maximizeInvokeResponse(minData);

      assertExpanded(result, true);

      minData = getMinData(false);
      result = Helpers.maximizeInvokeResponse(minData);
      assertExpanded(result, false);
    });
  });


  describe('#maximizeEvtMessage', () => {
    it('expands correctly', () => {
      const minData = {
        H: 'hub',
        M: 'method',
        A: 'args',
        S: 'state'
      };
      const result = Helpers.maximizeEvtMessage(minData)

      result.hub.should.equal('hub');
      result.method.should.equal('method');
      result.args.should.equal('args');
      result.state.should.equal('state');
    });
  });
});
