const MongoClient = require('mongodb');
const Grid = require('gridfs-stream');
const debug = require('debug')('vacation');
const url = require('../../script/db/mongo-url.js');

function errCheck(error, cb) {
  if (error) console.error(error);
  return cb(error);
}

class DbConn {
  constructor(colName) {
    this.onLoad = () => true;
    MongoClient.connect(url, (err, db) => {
      errCheck(err, () => {
        this.col = db.collection(colName);
        this.gfs = Grid(db, MongoClient);
        debug('Connected to Mongo');
        this.onLoad();
      });
    });
  }

  // insertOne: insert a single document into selected collection (e.g new user)
  // data in {x:y} format
  // returns the unique _id of the inserted document
  insertOne(data, cb) {
    return this.col.insertOne(data, (err, result) => {
      errCheck(err, () => {
        if (result.insertedCount === 1) {
          debug('Inserted one');
          cb(result.insertedId);
        } else {
          debug('Did not insert one document');
          cb(false);
        }
      });
    });
  }

  // insertMany: insert multiple items to db. (e.g. multiple image upload)
  // data in [{x:y} {x:z}] format
  // returns an array of the unique _id of the inserted documents
  insertMany(data, cb) {
    return this.col.insertMany(data, (err, result) => {
      errCheck(err, () => {
        if (result.insertedCount >= 1) {
          debug('Inserted more than one document');
          cb(result.insertedIds);
        } else {
          debug('Did not insert more than one document');
          cb(false);
        }
      });
    });
  }

  // findOne: find single item in collection that matches query (e.g. get user data)
  // query in {x:y} format
  findOne(query, cb) {
    if (query._id && typeof query._id === 'string') {
      query._id = new MongoClient.ObjectID(query._id);
    }
    return this.col.find(query).limit(1).next((err, doc) => {
      errCheck(err, () => {
        debug('Found one doc');
        return cb(doc);
      });
    });
  }

  // findMany: find all items in collection that matches query (e.g. items with rating)
  // query in {x:y} format
  findMany(query, cb) {
    return this.col.find(query).toArray((err, doc) => {
      errCheck(err, () => {
        debug('Found all docs that match query');
        return cb(doc);
      });
    });
  }

  // updateOne: update one doc in the collection (e.g. add email to user)
  // query in {x:y} format, data in {x:y} format
  updateOne(query, data, cb) {
    return this.col.updateOne(query, { $set: data }, (err, result) => {
      errCheck(err, () => {
        if (result.matchedCount === 1 && result.modifiedCount === 1) {
          debug('Updated one doc');
          cb(true);
        } else {
          debug('Did not update one document');
          cb(false);
        }
      });
    });
  }

  // updateMany: add data to all docs that match the query (e.g. add tags to multiple images)
  // query in {x:y} format, data in {x:y} format
  updateMany(query, data, cb) {
    return this.col.updateMany(query, { $set: data }, (err, result) => {
      errCheck(err, () => {
        if (result.matchedCount >= 1 && result.modifiedCount >= 1) {
          debug('Updated all docs that match query');
          cb(true);
        } else {
          debug('Did not update more than one document');
          cb(false);
        }
      });
    });
  }

  // removeOne: delete one item from collection (e.g. delete user)
  // query in {x:y} format
  removeOne(query, cb) {
    return this.col.deleteOne(query, (err, result) => {
      errCheck(err, () => {
        if (result.deletedCount === 1) {
          debug('Removed 1 doc');
          cb(true);
        } else {
          debug('Did not delete one document');
          cb(false);
        }
      });
    });
  }

  readFile(id) {
    return this.gfs.createReadStream({
      _id: id
    });
  }

  // removeMany: remove all docs matching query from collection (e.g. delete gallery)
  // query in {x:y} format
  removeMany(query, cb) {
    return this.col.deleteMany(query, (err, result) => {
      errCheck(err, () => {
        if (result.deletedCount >= 1) {
          debug('Removed all docs that match the query');
          cb(true);
        } else {
          debug('Did not remove more than one document');
          cb(false);
        }
      });
    });
  }
}

module.exports = DbConn;
