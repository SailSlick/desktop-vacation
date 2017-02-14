import { expect } from 'chai';
import DbConn from './db';


describe('Loki Db tools', () => {
  const testCol = new DbConn('host');
  describe('db#insertOne()', () => {
    it('Can insert into Db', (done) => {
      const testData = { backgrounds: 'areLife' };
      testCol.insert(testData, (cb) => {
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
      testCol.insert(testData, (cb) => {
        expect(cb).to.be.an('array');
        done();
      });
    });
  });

  describe('db#findOne()', () => {
    it('Can find one item in db through query', (done) => {
      const testQuery = { backgrounds: { $gte: 0 } };
      testCol.findOne(testQuery, (cb) => {
        expect(cb).to.be.an('object');
        done();
      });
    });

    it('Should get correct response if can\'t be found', (done) => {
      const testQuery = { backgrounds: 'nothere' };
      testCol.findOne(testQuery, (cb) => {
        expect(cb).to.not.be.ok;
        done();
      });
    });
  });

  describe('db#findMany()', () => {
    it('Can find multiple items in db that match query', (done) => {
      const testQuery = { screensavers: { $gte: 0 } };
      testCol.findMany(testQuery, (cb) => {
        expect(cb).to.be.an('array');
        done();
      });
    });
  });

  describe('db#findIndex()', () => {
    it('Can find item in db that match index query', (done) => {
      const testQueryIndex = 10;
      testCol.findMany(testQueryIndex, (cb) => {
        expect(cb).to.be.an('array');
        done();
      });
    });
  });

  describe('db#updateOne()', () => {
    it('Can update one item in db', (done) => {
      const testQuery = { backgrounds: 'areLife' };
      const testData = { backgrounds: 'areFunny' };
      testCol.updateOne(testQuery, testData, (cb) => {
        expect(cb).to.be.ok;
        done();
      });
    });

    it('Should get correct response if item to update isn\'t there', (done) => {
      const testQuery = { backgrounds: 'nothere' };
      const testData = { backgrounds: 'areFunny' };
      testCol.updateMany(testQuery, testData, (cb) => {
        expect(cb).to.not.be.ok;
        done();
      });
    });
  });

  describe('db#updateMany()', () => {
    it('Can update multiple items', (done) => {
      const testQuery = { screensavers: { $gt: 0 } };
      const testData = { screensavers: 'areWorthIt' };
      testCol.updateMany(testQuery, testData, (cb) => {
        expect(cb).to.be.ok;
      });
      done();
    });
  });

  describe('db#removeOne()', () => {
    it('Can remove item from db', (done) => {
      const testQuery = { backgrounds: { $gt: 0 } };
      testCol.removeOne(testQuery);
      testCol.findOne(testQuery, (cb) => {
        expect(cb).to.not.exist;
        done();
      });
    });

    it('Should get correct response for item to remove not being there', (done) => {
      const testQuery = { backgrounds: { $gt: 0 } };
      testCol.removeOne(testQuery);
      testCol.findOne(testQuery, (cb) => {
        expect(cb).to.not.exist;
        done();
      });
    });
  });

  describe('db#removeMany()', () => {
    it('Can remove multiple items that match query', (done) => {
      const testQuery = { screensavers: { $gt: 0 } };
      testCol.removeMany(testQuery);
      testCol.findOne(testQuery, (cb) => {
        expect(cb).to.not.exist;
        done();
      });
    });
  });
});
