const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();
const path = require('path');

let Helpers = require(path.join(__dirname, '..', 'src/helpers'));

describe('Helpers', () => {
  describe('#toString', () => {
    it('does not throw if null', () => {
      () => { Helpers.toString(null) }.should.not.throw(Error);
    });

    it('returns string', () => {
      Helpers.toString(null).should.equal('[object Null]');
      Helpers.toString({}).should.equal('[object Object]');
      Helpers.toString([]).should.equal('[object Array]');
    });
  });


  describe('#isArray', () => {
    it('does not throw if null', () => {
      () => { Helpers.isArray(null) }.should.not.throw(Error);
    });

    it('returns string', () => {
      Helpers.isArray(null).should.equal(false);
      Helpers.isArray({}).should.equal(false);
      Helpers.isArray([]).should.equal(true);
    });
  });
});
