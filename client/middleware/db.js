const Loki = require('lokijs');

const db = new Loki('./vacation.json');

class DbConn {
  constructor(colName) {
    this.onLoad = () => true;
    db.loadDatabase({}, () => {
      this.col = db.getCollection(colName);
      this.onLoad();
    });
  }

  static close() {
    db.saveDatabase(() => {
      console.log('Saving db, return:');
      db.quit();
    });
  }

  // insertOne: insert a single document into selected collection
  // data in {x:y} format
  // returns the inserted document
  insert(data) {
    return this.col.insert(data);
  }

  // findOne: find single item in collection that matches query
  // query in {x:y} format
  // returns the found document or null
  findOne(query) {
    return this.col.findOne(query);
  }

  // findMany: find all items in collection that matches query
  // query in {x:y} format
  // returns the found documents or an empty array
  findMany(query) {
    return this.col.find(query);
  }

  // findIndex: finds item in collection at index starting at 1
  // index is an int
  // returns the found document or null
  findIndex(index) {
    return this.col.get(index);
  }

  // updateOne: update one doc in the collection
  // query in {x:y} format, data in {x:y} format
  updateOne(query, data) {
    const doc = this.col.findOne(query);
    for (const key in data) {
      if (doc[key]) {
        doc.key = data[key];
      }
    }
    this.col.update(doc);
    return doc;
  }

  // updateMany: add data to all docs that match the query
  // query in {x:y} format, data in {x:y} format
  updateMany(query, data) {
    this.col.chain().find(query).update((obj) => {
      for (const key in data) {
        if (obj[key]) {
          obj.key = data[key];
        }
      }
      return obj;
    });
  }

  // removeOne: delete one item from collection
  // query in {x:y} format
  removeOne(query) {
    const doc = this.col.findOne(query);
    this.col.remove(doc);
  }

  // removeMany: remove all docs matching query from collection
  // query in {x:y} format
  removeMany(query) {
    this.col.chain().find(query).remove();
  }
}

module.exports = DbConn;
