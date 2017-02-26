conn = new Mongo("localhost:27017");

db = conn.getDB("vacation");

db.createUser(
  {
    user: "USERNAMEHERE",
    pwd: "PASSWORDHERE",
    roles: [
        { role: "readWrite", db: "vacation" }
      ]
  }
)
