conn = new Mongo("localhost:9001");
db = conn.getDB("vacation");
print("all dbs", db.adminCommand('listDatabases'));
print("removing old collections and replacing with sample data.")
db.users.drop()
db.images.drop()
db.galleries.drop()

db.galleries.insert(
  {
    "_id": ObjectId("2g6c2b97bac0595474108b48"),
    "name": "testuser_all",
    "tags": ["blam"],
    "subgallaries": [
      ObjectId("hk4c2b97bac0595474108b48"),
      ObjectId("2g6c2b97bac0595474108b48")
    ],
    "images": [
      ObjectId("542c2b97bac0595474138b48"),
      ObjectId("800c2b97bac0595474108b48"),
      ObjectId("a42c2b97bac0595474138b48"),
      ObjectId("876c2b97bac0595474108b48"),
      ObjectId("276c2jghbac0595474108b48"),
      ObjectId("fg6c2jghbac0595474108b48")
    ]
  },
  {
    "_id": ObjectId("hk4c2b97bac0595474108b48"),
    "name": "phone",
    "tags": ["oohlaala"],
    "subgallaries": [],
    "images": [
      ObjectId("276c2jghbac0595474108b48"),
      ObjectId("fg6c2jghbac0595474108b48")
    ]
  },
  {
    "_id": ObjectId("2g6c2b97bac0595474108b48"),
    "name": "favourites",
    "tags": [],
    "subgallaries": [],
    "images": [
      ObjectId("800c2b97bac0595474108b48"),
      ObjectId("a42c2b97bac0595474138b48"),
      ObjectId("876c2b97bac0595474108b48")
    ]
  }
);
