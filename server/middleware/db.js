const MongoClient = require("mongodb");

// url for the db
var url = 'mongodb://localhost:27017/vacation';

function errCheck(error, cb) {
  if (error) {
    throw error;
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
  updateOne(query, data) {
    return this.col.updateOne(query, { $set: data }, (err, result) => {
      errCheck(err, _ => {
        if (result.matchedCount == 1 & result.modifiedCount == 1) {
          console.log("Updated one doc");
        } else {
          console.log("Did not update one document");
        }
      });
    });
  }

  // updateMany: add data to all docs that match the query (e.g. add tags to multiple images)
  // query in {x:y} format, data in {x:y} format
  updateMany(query, data) {
    return this.col.updateMany(query, { $set: data }, (err, result) => {
      errCheck(err, _ => {
        if (result.matchedCount >= 1 & result.modifiedCount >= 1) {
          console.log("Updated all docs that match query");
        } else {
          console.log("Did not update more than one document");
        }
      });
    });
  }

  // removeOne: delete one item from collection (e.g. delete user)
  // query in {x:y} format
  removeOne(query) {
    return this.col.deleteOne(query, (err, result) => {
      errCheck(err, _ => {
        if (result.deletedCount == 1) {
          console.log("Removed 1 doc");
        } else {
          console.log("Did not delete one document");
        }
      });
    });
  }

  // removeMany: remove all docs matching query from collection (e.g. delete gallery)
  // query in {x:y} format
  removeMany(query) {
    return this.col.deleteMany(query, (err, result) => {
      errCheck(err, _ => {
         if (result.deletedCount >= 1) {
          console.log("Removed all docs that match the query");
        } else {
          console.log("Did not remove more than one document");
        }
      });
    });
  }
}

module.exports = DbConn;
