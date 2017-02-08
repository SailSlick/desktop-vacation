conn = new Mongo("localhost:18765");
db = conn.getDB("vacation");
print("all dbs", db.adminCommand('listDatabases'));
print("removing old collections and replacing with sample data.")
db.users.drop()
db.images.drop()
db.galleries.drop()
db.tests.drop()

print("all collections", db.getCollectionNames());
