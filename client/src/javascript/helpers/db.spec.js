import { expect } from 'chai';
import DbConn from './db';

let testCol;

describe('Loki Db tools', () => {
  // Events
  document.addEventListener('database_loaded', () => {
    testCol = new DbConn('host');

    describe('insertOne()', () => {
      it('Can insert into Db', (done) => {
        const testData = { backgrounds: 'areLife' };
        testCol.insert(testData, (doc) => {
          expect(doc).to.exist;
          done();
        });
      });
    });

    describe('insertMany()', () => {
      it('Can insert multiple items at once', (done) => {
        const testData = [
          { screensavers: 'areGreat' },
          { screensavers: 'areRest' }
        ];
        testCol.insert(testData, (doc) => {
          expect(doc).to.be.an('array');
          done();
        });
      });
    });

    describe('findOne()', () => {
      it('Can find one item in db through query', (done) => {
        const testQuery = { backgrounds: { $gte: 0 } };
        testCol.findOne(testQuery, (doc) => {
          expect(doc).to.be.an('object');
          done();
        });
      });

      it('Should get correct response if can\'t be found', (done) => {
        const testQuery = { backgrounds: 'nothere' };
        testCol.findOne(testQuery, (doc) => {
          expect(doc).to.not.be.ok;
          done();
        });
      });
    });

    describe('findMany()', () => {
      it('Can find multiple items in db that match query', (done) => {
        const testQuery = { screensavers: { $gte: 0 } };
        testCol.findMany(testQuery, (doc_array) => {
          expect(doc_array).to.be.an('array');
          done();
        });
      });
    });

    describe('findIndex()', () => {
      it('Can find item in db that match index query', (done) => {
        const testQueryIndex = 1;
        testCol.findIndex(testQueryIndex, (doc) => {
          expect(doc).to.be.an('object');
          done();
        });
      });
    });

    describe('updateOne()', () => {
      it('Can update one item in db', (done) => {
        const testQuery = { backgrounds: 'areLife' };
        const testData = { backgrounds: 'areFunny' };
        testCol.updateOne(testQuery, testData, (doc) => {
          expect(doc).to.be.ok;
          done();
        });
      });

      it('Should get correct response if item to update isn\'t there', (done) => {
        const testQuery = { backgrounds: 'nothere' };
        const testData = { backgrounds: 'areFunny' };
        testCol.updateMany(testQuery, testData, (doc) => {
          expect(doc).to.not.be.ok;
          done();
        });
      });
    });

    describe('updateMany()', () => {
      it('Can update multiple items', (done) => {
        const testQuery = { screensavers: { $gt: 0 } };
        const testData = { screensavers: 'areWorthIt' };
        testCol.updateMany(testQuery, testData, (doc_array) => {
          expect(doc_array).to.be.ok;
        });
        done();
      });
    });

    describe('removeOne()', () => {
      it('Can remove item from db', (done) => {
        const testQuery = { backgrounds: { $gt: 0 } };
        testCol.removeOne(testQuery);
        testCol.findOne(testQuery, (doc) => {
          expect(doc).to.not.exist;
          done();
        });
      });

      it('Should get correct response for item to remove not being there', (done) => {
        const testQuery = { backgrounds: { $gt: 0 } };
        testCol.removeOne(testQuery);
        testCol.findOne(testQuery, (doc) => {
          expect(doc).to.not.exist;
          done();
        });
      });
    });

    describe('removeMany()', () => {
      it('Can remove multiple items that match query', (done) => {
        const testQuery = { screensavers: { $gt: 0 } };
        testCol.removeMany(testQuery);
        testCol.findOne(testQuery, (doc) => {
          expect(doc).to.not.exist;
          done();
        });
      });
    });
  }, false);
});
