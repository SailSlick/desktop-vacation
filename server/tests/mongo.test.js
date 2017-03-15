const MongoTools = require('../middleware/db');
const assert = require('assert');
const chai = require('chai');

const dbConn = new MongoTools('test');
const expect = chai.expect;

describe('Db tools', () => {
  dbConn.onLoad = () => {
    console.log('mongo', dbConn.col.s.name);
    describe('db#insertOne()', () => {
      it('Can insert into Db', (done) => {
        const testData = { backgrounds: 'areLife' };
        dbConn.insertOne(testData, (cb) => {
          expect(cb).to.exist;
          done();
        });
      });
    });

    describe('db#insertMany()', () => {
      it('Can insert multiple items at once', (done) => {
        const testData = [
          { screensavers: 'areGreat' },
          { screensavers: 'areRest' }
        ];
        dbConn.insertMany(testData, (cb) => {
          expect(cb).to.be.an('array');
          done();
        });
      });
    });

    describe('db#findOne()', () => {
      it('Can find one item in db through query', (done) => {
        const testQuery = { backgrounds: { $exists: true } };
        dbConn.findOne(testQuery, (cb) => {
          expect(cb).to.be.an('object');
          done();
        });
      });

      it('Should get correct response if can\'t be found', (done) => {
        const testQuery = { backgrounds: 'nothere' };
        dbConn.findOne(testQuery, (cb) => {
          expect(cb).to.not.be.ok;
          done();
        });
      });
    });

    describe('db#findMany()', () => {
      it('Can find multiple items in db that match query', (done) => {
        const testQuery = { screensavers: { $exists: true } };
        dbConn.findMany(testQuery, (cb) => {
          expect(cb).to.be.an('array');
          done();
        });
      });
    });

    describe('db#updateOne()', () => {
      it('Can update one item in db', (done) => {
        const testQuery = { backgrounds: 'areLife' };
        const testData = { backgrounds: 'areFunny' };
        dbConn.updateOne(testQuery, testData, (cb) => {
          assert.ok(cb);
          done();
        });
      });

      it('Should get correct response if item to update isn\'t there', (done) => {
        const testQuery = { backgrounds: 'nothere' };
        const testData = { backgrounds: 'areFunny' };
        dbConn.updateOne(testQuery, testData, (cb) => {
          expect(cb).to.not.be.ok;
          done();
        });
      });
    });

    describe('db#updateMany()', () => {
      it('Can update multiple items', (done) => {
        const testQuery = { screensavers: { $exists: true } };
        const testData = { screensavers: 'areWorthIt' };
        dbConn.updateMany(testQuery, { $set: testData }, (cb) => {
          assert.ok(cb);
          done();
        });
      });
    });

    describe('db#removeOne()', () => {
      it('Can remove item from db', (done) => {
        const testQuery = { backgrounds: { $exists: true } };
        dbConn.removeOne(testQuery, (cb) => {
          assert.ok(cb);
          done();
        });
      });

      it('Should get correct response for item to remove not being there', (done) => {
        const testQuery = { backgrounds: { $exists: true } };
        dbConn.removeOne(testQuery, (cb) => {
          expect(cb).to.not.be.ok;
          done();
        });
      });
    });

    describe('db#removeMany()', () => {
      it('Can remove multiple items that match query', (done) => {
        const testQuery = { screensavers: { $exists: true } };
        dbConn.removeMany(testQuery, (cb) => {
          assert.ok(cb);
          done();
        });
      });
    });
  };
});

describe('Array', () => {
  describe('#indexOf()', () => {
    it('should return -1 when the value is not present', () => {
      assert.equal(-1, [1, 2, 3].indexOf(4));
    });
  });
});
