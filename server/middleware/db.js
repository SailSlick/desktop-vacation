const MongoClient = require("mongodb");
const fs = require('fs');

// url for the db
fs.readFile('../hidden/mongo/mongo-user-pw', 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  var pw = data;
  console.log(data);
});

var url = "mongodb://vaca:vacationsAreAtScreens@localhost:18765/vacation??authMechanism=SCRAM-SHA-1"

function errCheck(error, cb) {
  if (error) {
    console.log(error);
  }
  return cb();
}

class DbConn {
  constructor(colName) {
    this.onLoad = _ => true;
    MongoClient.connect(url, (err, db) => {
      errCheck(err, _ => {
        this.col = db.collection(colName);
        console.log("Connected to Mongo");
        this.onLoad();
      });
    });
  }

  // insertOne: insert a single document into selected collection (e.g new user)
  // data in {x:y} format
  // returns the unique _id of the inserted document
  insertOne(data, cb) {
    return this.col.insertOne(data, (err, result) => {
      errCheck(err, _ => {
        if (result.insertedCount == 1) {
          console.log("Inserted one");
          cb(result.insertedId)
        } else {
          console.log("Did not insert one document");
          cb(false)
        }
      });
    });
  }

  // insertMany: insert multiple items to db. (e.g. multiple image upload)
  // data in [{x:y} {x:z}] format
  // returns an array of the unique _id of the inserted documents
  insertMany(data, cb) {
    return this.col.insertMany(data, (err, result) => {
      errCheck(err, _ => {
        if (result.insertedCount > 1) {
          console.log("Inserted more than one document");
          cb(result.insertedIds)
        } else {
          console.log("Did not insert more than one document");
          cb(false)
        }
      });
    });
  }

  // findOne: find single item in collection that matches query (e.g. get user data)
  // query in {x:y} format
  findOne(query, cb) {
    return this.col.find(query).limit(1).next((err, doc) => {
      errCheck(err, _ => {
        console.log("Found one doc");
        return cb(doc);
      });
    });
  }

  // findMany: find all items in collection that matches query (e.g. items with rating)
  // query in {x:y} format
  findMany(query, cb) {
    return this.col.find(query).toArray((err, doc) => {
      errCheck(err, _ => {
        console.log("Found all docs that match query");
        return cb(doc);
      });
    });
  }

  // updateOne: update one doc in the collection (e.g. add email to user)
  // query in {x:y} format, data in {x:y} format
  updateOne(query, data, cb) {
    return this.col.updateOne(query, { $set: data }, (err, result) => {
      errCheck(err, _ => {
        if (result.matchedCount == 1 & result.modifiedCount == 1) {
          console.log("Updated one doc");
          cb(true);
        } else {
          console.log("Did not update one document");
          cb(false);
        }
      });
    });
  }

  // updateMany: add data to all docs that match the query (e.g. add tags to multiple images)
  // query in {x:y} format, data in {x:y} format
  updateMany(query, data, cb) {
    return this.col.updateMany(query, { $set: data }, (err, result) => {
      errCheck(err, _ => {
        if (result.matchedCount >= 1 & result.modifiedCount >= 1) {
          console.log("Updated all docs that match query");
          cb(true);
        } else {
          console.log("Did not update more than one document");
          cb(false);
        }
      });
    });
  }

  // removeOne: delete one item from collection (e.g. delete user)
  // query in {x:y} format
  removeOne(query, cb) {
    return this.col.deleteOne(query, (err, result) => {
      errCheck(err, _ => {
        if (result.deletedCount == 1) {
          console.log("Removed 1 doc");
          cb(true);
        } else {
          console.log("Did not delete one document");
          cb(false);
        }
      });
    });
  }

  // removeMany: remove all docs matching query from collection (e.g. delete gallery)
  // query in {x:y} format
  removeMany(query, cb) {
    return this.col.deleteMany(query, (err, result) => {
      errCheck(err, _ => {
         if (result.deletedCount >= 1) {
          console.log("Removed all docs that match the query");
          cb(true);
        } else {
          console.log("Did not remove more than one document");
          cb(false);
        }
      });
    });
  }
}

module.exports = DbConn;
