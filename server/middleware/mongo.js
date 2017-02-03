const MongoClient = require("mongodb");

// url for the db
var url = 'mongodb://localhost:27017/vacation';

function getCollection(url, colName, col) {
  MongoClient.connect(url, function(error, db) {
    if (error) {
      throw error;
    } else {
      console.log("Connected to Mongo");
    }

    col(db.collection(colName));
  });
}

module.exports = {
  url,

  // insertOne: insert a single document into selected collection (e.g new user)
  // data in {x:y} format
  // returns the unique _id of the inserted document
  insertOne: function(colName, data, cb) {
    getCollection(url, colName, function(col) {
      col.insertOne(data, function (err, result) {
        if (err) {
          throw err;
        } else if (result.insertedCount == 1) {
          console.log("Inserted one");
          cb(result.insertedId)
        } else {
          console.log("Did not insert one document");
        };
      });
    });
  },

  // insertMany: insert multiple items to db. (e.g. multiple image upload)
  // data in [{x:y}, {x:z}] format
  // returns an array of the unique _id of the inserted documents
  insertMany: function(colName, data, cb) {
    getCollection(url, colName, function (col) {
      col.insertMany(data, function (err, result){
        if (err){
          throw err;
        } else if (result.insertedCount > 1) {
          console.log("Inserted more than one document");
          cb(result.insertedIds)
        } else {
          console.log("Did not insert more than one document");
        };
      });
    });
  },

  // findOne: find single item in collection that matches query (e.g. get user data)
  // query in {x:y} format
  findOne: function(colName, query, cb) {
    getCollection(url, colName, function(col) {
      col.find(query).limit(1).next(function(err, doc) {
        if (err){
          throw err;
        } else {
          console.log("Found one doc");
          return cb(doc);
        };
      });
    });
  },

  // findMany: find all items in collection that matches query (e.g. items with rating)
  // query in {x:y} format
  findMany: function (colName, query, cb) {
    getCollection(url, colName, function(col) {
      col.find(query).toArray(function(err, doc) {
        if (err) {
          throw err;
        } else {
          console.log("Found all docs that match query");
          return cb(doc);
        };
      });
    });
  },

  // updateOne: update one doc in the collection (e.g. add email to user)
  // query in {x:y} format, data in {x:y} format
  updateOne: function(colName, query, data) {
    getCollection(url, colName, function(col) {
      col.updateOne(query, { $set: data }, function(err, result) {
        if (err) {
          throw err;
        } else if (result.matchedCount == 1 & result.modifiedCount == 1) {
          console.log("Updated one doc");
        } else {
          console.log("Did not update one document");
        };
      });
    });
  },

  // updateMany: add data to all docs that match the query (e.g. add tags to multiple images)
  // query in {x:y} format, data in {x:y} format
  updateMany: function(colName, query, data) {
    getCollection(url, colName, function(col) {
      col.updateMany(query, { $set: data }, function(err, result) {
        if (err) {
          throw err;
        } else if (result.matchedCount >= 1 & result.modifiedCount >= 1) {
          console.log("Updated all docs that match query");
        } else {
          console.log("Did not update more than one document");
        };
      });
    });
  },

  // removeOne: delete one item from collection (e.g. delete user)
  // query in {x:y} format
  removeOne: function(colName, query) {
    getCollection(url, colName, function(col) {
      col.deleteOne(query, function(err, result) {
        if (err){
          throw err;
        } else if (result.deletedCount == 1) {
          console.log("Removed 1 doc");
        } else {
          console.log("Did not delete one document");
        };
      });
    });
  },

  // removeMany: remove all docs matching query from collection (e.g. delete gallery)
  // query in {x:y} format
  removeMany: function(colName, query) {
    getCollection(url, colName, function(col) {
      col.deleteMany(query, function(err, result) {
        if (err){
          throw err;
        } else if (result.deletedCount >= 1) {
          console.log("Removed all docs that match the query");
        } else {
          console.log("Did not remove more than one document");
        };
      });
    });
  }
};
