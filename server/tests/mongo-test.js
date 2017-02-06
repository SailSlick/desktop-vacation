const MongoTools = require("../middleware/db");

const dbConn = new MongoTools("test");

function testInsertOne() {
  var testData = {"backgrounds": "areLife"};
  dbConn.insertOne(testData, cb => {
    console.log(cb);
  });
}

function testInsertMany() {
  var testData = [
    {"screensavers": "areGreat"},
    {"screensavers": "areRest"}
  ];
  dbConn.insertMany(testData, cb => {
    console.log(cb);
  });
}

function testFindOne() {
  var testQuery = {"backgrounds": {$exists:true}};
  dbConn.findOne(testQuery, cb => {
    console.log(cb);
  });
}

function testFindMany() {
  var testQuery = {"screensavers": {$exists:true}};
  dbConn.findMany(testQuery, cb => {
    console.log(cb);
  });
}

function testUpdateOne() {
  var testQuery = {"backgrounds": "areLife"};
  var testData = {"backgrounds": "areFunny"};
  dbConn.updateOne(testQuery, testData);
}

function testUpdateMany() {
  var testQuery = {"screensavers": {$exists:true}};
  var testData = {"screensavers": "areWorthIt"};
  dbConn.updateMany(testQuery, testData);
}

function testRemoveOne() {
  var testQuery = {"backgrounds": {$exists:true}};
  dbConn.removeOne(testQuery);
}

function testRemoveMany() {
  var testQuery = {"screensavers": {$exists:true}};
  dbConn.removeMany(testQuery);
}

dbConn.onLoad = _ => {
  testInsertOne();
  testInsertMany();
  testFindOne();
  testFindMany();
  testUpdateOne();
  testUpdateMany();
  testRemoveOne();
  testRemoveMany();
}
