const MongoTools = require('../middleware/db');
var assert = require('assert');
var chai = require('chai');

const dbConn = new MongoTools('test');

describe('Db tools', function () {
  dbConn.onLoad = _ => {

    describe('#insertOne()', _ => {
      it("Can insert into Db", done => {
        var testData = {"backgrounds": "areLife"};
        dbConn.insertOne(testData, cb => {
          console.log("insertOne", cb);
          chai.expect(cb).to.exist;
          done();
        });
      });
    });

    describe('#insertMany()', _ => {
      it("Can insert multiple items at once", done => {
        var testData = [
          {"screensavers": "areGreat"},
          {"screensavers": "areRest"}
        ];
        dbConn.insertMany(testData, cb => {
          console.log("insertMany", cb);
          chai.expect(cb).to.be.an('array');
          done();
        });
      });
    });

    describe('#findOne()', _ => {
      it("Can find one item in db through query", done => {
        var testQuery = {"backgrounds": {$exists:true}};
        dbConn.findOne(testQuery, cb => {
          console.log("findOne", cb);
          chai.expect(cb).to.be.an('object');
          done();
        });
      });

      it("Get correct response if can't be found", done => {
        var testQuery = {"backgrounds": "nothere"};
        dbConn.findOne(testQuery, cb => {
          console.log("findOneNotThere", cb);
          chai.expect(cb).to.not.be.ok;
          done();
        });
      });
    });

    describe('#findMany()', _ => {
      it("Can find multiple items in db that match query", done => {
        var testQuery = {"screensavers": {$exists:true}};
        dbConn.findMany(testQuery, cb => {
          console.log("findMany", cb);
          chai.expect(cb).to.be.an('array');
          done();
        });
      });
    });

    describe('#updateOne()', _ => {
      it("Can update one item in db", done => {
        var testQuery = {"backgrounds": "areLife"};
        var testData = {"backgrounds": "areFunny"};
        dbConn.updateOne(testQuery, testData, cb => {
          console.log("UpdateOne", cb);
          assert.ok(cb);
          done();
        });
      });

      it("Get correct response if item to update isn't there", done => {
        var testQuery = {"backgrounds": "nothere"};
        var testData = {"backgrounds": "areFunny"};
        dbConn.updateOne(testQuery, testData, cb => {
          console.log("UpdateOneNotThere", cb);
          chai.expect(cb).to.not.be.ok;
          done();
        });
      });
    });

    describe('#updateMany()', _ => {
      it("Can update multiple items", done => {
        var testQuery = {"screensavers": {$exists:true}};
        var testData = {"screensavers": "areWorthIt"};
        dbConn.updateMany(testQuery, testData, cb => {
          console.log("UpdateMany", cb);
          assert.ok(cb);
          done();
        });
      });
    });

    describe('#removeOne()', _ => {
      it("Can remove item from db", done => {
        var testQuery = {"backgrounds": {$exists:true}};
        dbConn.removeOne(testQuery, cb => {
          console.log("removeOne", cb);
          assert.ok(cb);
          done();
        });
      });

      it("Get correct response for item to remove not being there", done => {
        var testQuery = {"backgrounds": {$exists:true}};
        dbConn.removeOne(testQuery, cb => {
          console.log("removeOneNotThere", cb);
          chai.expect(cb).to.not.be.ok;
          done();
        });
      });
    });

    describe('#removeMany()', _ => {
      it("Can remove multiple items that match query", done => {
        var testQuery = {"screensavers": {$exists:true}};
        dbConn.removeMany(testQuery, cb => {
          console.log("removeMany", cb);
          assert.ok(cb);
          done();
        });
      });
    });
  }
});

describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal(-1, [1,2,3].indexOf(4));
    });
  });
});
