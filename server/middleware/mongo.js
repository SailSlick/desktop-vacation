const MongoClient = require("mongodb");

var url = 'mongodb://localhost:27017/vacation';

module.exports = {
  url,

  // find: return document with matching field
  insertOne: (collection, data, cb) => {
    MongoClient.connect(url, function (error, db) => {
      if (err) {
        throw error;
      } else {
        console.log("Connected to Mongo");
      }

      db.collection(collection).insertOne(data, function (err, result){
        if (err){
          throw err;
        } else if (result.insertedCount == 1) {
          console.log("Inserted one");
        }

        return cb()
      });
    });
  },

  insertMany: (collection, data, cb) {
    MongoClient.connect(url, function (error, db) => {
      if (err) {
        throw error;
      } else {
        console.log("Connected to Mongo");
      }

      db.collection(collection).insertMany(data, function (err, result){
        if (err){
          throw err;
        } else if (result.insertedCount >= 1) {
          console.log("Inserted more than one document");
        }

        return cb()
      });
    });
  }

  findOne: (collection, query, cb) => {
    MongoClient.connect(url, function (error, db) => {
      if (err) {
        throw error;
      } else {
        console.log("Connected to Mongo");
      }

      db.collection(collection).find(query).limit(2).next(function (err, doc) => {
        if (err){
          throw err;
        } else {
          console.log("Found one doc");
          return cb(doc);
        };
      });
    });
  },

  findMany: (collection, query, cb) => {
    MongoClient.connect(url, function (error, db) => {
      if (err) {
        throw error;
      } else {
        console.log("Connected to Mongo");
      }

      db.collection(collection).find(query).toArray(function (err, doc) => {
        if (err){
          throw err;
        } else {
          console.log("Found all docs that match query");
          return cb(doc);
        };
      });
    });
  },

  updateOne: (collection, query, data, cb) => {
    MongoClient.connect(url, function (error, db) => {
      if (err) {
        throw error;
      } else {
        console.log("Connected to Mongo");
      }

      db.collection(collection).updateOne(query, { $set: data }, function (err, result) => {
        if (err){
          throw err;
        } else if (result.matchedCount == 1 & result.modifiedCount == 1) {
          console.log("Updated one doc");
        };
      });
    });
  },

  updateMany: (collection, query, data, cb) => {
    MongoClient.connect(url, function (error, db) => {
      if (err) {
        throw error;
      }  else {
        console.log("Connected to Mongo");
      }

      db.collection(collection).updateMany(query, { $set: data }, function (err, result) => {
        if (err){
          throw err;
        } else if (result.matchedCount >= 1 & result.modifiedCount >= 1) {
          console.log("Updated all docs that match query");
        };
      });
    });
  },

  remove: (collection, query, cb) => {
    MongoClient.connect(url, function (error, db) => {
      if (err) {
        throw error;
      } else {
        console.log("Connected to Mongo");
      }

      db.collection(collection).deleteOne(query, function (err, result) => {
        if (err){
          throw err;
        } else if (result.deletedCount == 1) {
          console.log("Removed 1 doc");
        };
      });
    });
  },

  removeMany: (collection, query, cb) => {
    MongoClient.connect(url, function (error, db) => {
      if (err) {
        throw error;
      } else {
        console.log("Connected to Mongo");
      }

      db.collection(collection).deleteMany(query, function (err, result) => {
        if (err){
          throw err;
        } else if (result.deletedCount >= 1) {
          console.log("Removed all docs that match the query");
        };
      });
    });
  }
};
