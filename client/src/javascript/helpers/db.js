import { join } from 'path';
import jetpack from 'fs-jetpack';
import Loki from 'lokijs';
import { ipcRenderer as ipc } from 'electron';

let db;
const ready_event = new Event('database_loaded');

function createConnection(storagePath) {
  const dbPath = join(storagePath, 'vacation.json');
  // Copy empty db to the folder if it doesn't exist
  if (!jetpack.exists(dbPath)) jetpack.copy(join(__dirname, 'userData', 'vacation.json'), dbPath);

  // Load the database now
  db = new Loki(dbPath);
  db.userDataFolder = storagePath;
  db.loadDatabase({}, () => {
    console.log('Database loaded from', dbPath);
    document.dispatchEvent(ready_event);
  });
}

class DbConn {
  constructor(colName) {
    this.col = db.getCollection(colName);
  }

  static getUserDataFolder() {
    return db.userDataFolder;
  }

  // eslint-disable-next-line class-methods-use-this
  save(cb) {
    db.saveDatabase(cb);
  }

  // insert: insert a single document into selected collection
  // data in {x:y} format
  // returns the inserted document
  insert(data, cb) {
    cb(this.col.insert(data));
  }

  // findOne: find single item in collection that matches query
  // query in {x:y} format
  // returns the found document or null
  findOne(query, cb) {
    cb(this.col.findOne(query));
  }

  // findMany: find all items in collection that matches query
  // query in {x:y} format
  // returns the found documents or an empty array
  findMany(query, cb) {
    cb(this.col.find(query));
  }

  // findIndex: finds item in collection at index starting at 1
  // index is an int
  // returns the found document or null
  findIndex(index, cb) {
    cb(this.col.get(index));
  }

  // updateOne: update one doc in the collection
  // query in {x:y} format, data in {x:y} format
  // returns the updated doc or null
  updateOne(query, data, cb) {
    const doc = this.col.findOne(query);
    if (doc) {
      for (const key in data) {
        doc[key] = data[key];
      }
      this.col.update(doc);
    }
    cb(doc);
  }

  // updateMany: add data to all docs that match the query
  // query in {x:y} format, data in {x:y} format
  // returns an array of the updated docs
  updateMany(query, data, cb) {
    const test = this.col.chain().find(query).update((obj) => {
      if (obj) {
        for (const key in data) {
          obj[key] = data[key];
        }
        cb(obj);
      }
    });
    if (test.filteredrows.length === 0) {
      cb(null);
    }
  }

  // removeOne: delete one item from collection
  // query in {x:y} format
  removeOne(query, cb) {
    const doc = this.col.findOne(query);
    if (doc) {
      return cb(this.col.remove(doc));
    }
    return cb();
  }

  // removeMany: remove all docs matching query from collection
  // query in {x:y} format
  removeMany(query, cb) {
    this.col.chain().find(query).remove();
    return cb();
  }

  emptyCol(cb) {
    this.col.clear();
    cb();
  }
}

// Events
// Manually set the userData folder for testing purposes
if (process.env.NODE_ENV === 'dev') {
  createConnection(join(__dirname, 'userData'));
} else {
  ipc.send('get-userData-path');
  ipc.on('userData-path', (event, userDataPath) => createConnection(userDataPath));
}

export default DbConn;
