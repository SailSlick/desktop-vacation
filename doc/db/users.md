# Database for User Data

The User database holds the account data for each user and a data structure containing the list of gallaries and image references to the imagedb.

Contains
-------------
| Field | Description|
|-------|------------|
| _id | the unique document id generated by mongodb that acts as a primary key for this document. |
| username | The Username of the user. |
| password | A salt and the hashed password will be stored. These are stored in the same string in bcrypt. |
| gallery | This is a document id for the user's root gallery in the gallerydb  |
| groups | This is a list of group ids that the user is a member of. |

Example Document
----------------
```js
{
  "_id" : ObjectId("542c2b97bac0595474108b48"),
  "username" : "testuser" ,
  "password" : "$2a$10$oU2WWLC8339f4F.A.bb4/.4hpDH9mZZMkdSZtGUckS7LBC8nGOFsG",
  "gallery" : ObjectId("sj478b97bac0595474108b48"),
  "invites" : [{
    "groupname": "coolthings" ,
    "gid": ObjectId("klle8b97bac0595474108b48")
  }],
  "groups" : [
    ObjectId("qj478b97bac0595474108b48"),
    ObjectId("spd78b97bac0595474108b48")
  ]
}
```
