const MongoTools = require("../middleware/mongo");

function testInsertOne() {
  var testCol = "tests";
  var testData = {"backgrounds": "areLife"};
  MongoTools.insertOne(testCol, testData);
}

function testInsertMany() {
  var testCol = "tests";
  var testData = [
    {"screensavers": "areGreat"},
    {"screensavers": "areRest"}
  ];
  MongoTools.insertMany(testCol, testData);
}

function testFindOne() {
  var testCol = "tests";
  var testQuery = {"backgrounds": {$exists:true}};
  MongoTools.findOne(testCol, testQuery, function(cb) {
    console.log(cb);
  });
}

function testFindMany() {
  var testCol = "tests";
  var testQuery = {"screensavers": {$exists:true}};
  MongoTools.findMany(testCol, testQuery, function(cb) {
    console.log(cb);
  });
}

function testUpdateOne() {
  var testCol = "tests";
  var testQuery = {"backgrounds": "areLife"};
  var testData = {"backgrounds": "areFunny"};
  MongoTools.updateOne(testCol, testQuery, testData);
}

function testUpdateMany() {
  var testCol = "tests";
  var testQuery = {"screensavers": {$exists:true}};
  var testData = {"screensavers": "areWorthIt"};
  MongoTools.updateMany(testCol, testQuery, testData);
}

function testRemoveOne() {
  var testCol = "tests";
  var testQuery = {"backgrounds": {$exists:true}};
  MongoTools.removeOne(testCol, testQuery);
}

function testRemoveMany() {
  var testCol = "tests";
  var testQuery = {"screensavers": {$exists:true}};
  MongoTools.removeMany(testCol, testQuery);
}

testInsertOne()
testInsertMany()
testFindOne()
testFindMany()
testUpdateOne()
testUpdateMany()
testRemoveOne()
testRemoveMany()
