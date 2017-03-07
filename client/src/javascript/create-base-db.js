const path = require('path');
const Loki = require('lokijs');

const db = new Loki(path.join(__dirname, '../../app/userData/vacation.json'));
db.addCollection('galleries');
db.addCollection('host');
db.addCollection('images');

db.saveDatabase(() => process.exit(0));
