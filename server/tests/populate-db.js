const MongoTools = require("../../server/middleware/mongo");

function insertImages() {
  // insert Images
  var imageCol = "images";
  var imageData = [{
      "hash" : "34123187ndf9813fhq9348",
      "metadata" : {"rating": 3, "tags": ["winter", "chill"]},
      "location" : "/home/1.png"
    }, {
      "hash" : "34123187ndf9813fhq9348",
      "metadata" : {"rating": 1, "tags": ["winter", "chill"]},
      "location" : "/home/2.png"
    }, {
      "hash" : "34123187ndf9813fhq9348",
      "metadata" : {"rating": 3, "tags": ["winter", "chill"]},
      "location" : "/home/3.png"
    }, {
      "hash" : "34123187ndf9813fhq9348",
      "metadata" : {"rating": 4, "tags": ["summer", "chill"]},
      "location" : "/home/4.png"
    }];
  MongoTools.insertMany(imageCol, imageData, function(cb) {
    console.log("Images added, refs:", cb);
    galleries1(cb);
  });
}

function galleries1(imageRefs) {
  // insert sub-galleries
  var galCol = "galleries";
  var galData = [{
      "name": "phone",
      "tags": ["oohlaala"],
      "subgallaries": [],
      "images": imageRefs.slice(0,3)
    }, {
      "name": "winter",
      "tags": ["oohlaala"],
      "subgallaries": [],
      "images": imageRefs.slice(0,2)
    }];
  MongoTools.insertMany(galCol, galData, function(cb) {
    console.log("sub gallery refs:", cb);
    galleries2(imageRefs, cb);
  });
}

function galleries2(imageRefs, galleryRefs) {
  // insert the gallery for the main user
  var galCol = "galleries";
  var galData2 = {
      "name": "testuser_all",
      "tags": ["blam"],
      "subgallaries": galleryRefs,
      "images": imageRefs
    }
  MongoTools.insertOne(galCol, galData2, function(cb) {
    console.log("Galleries added, main ref:", cb);
    users(cb);
  });
}

function users(mainGal) {
  // insert users
  // pw is testuser1
  var galCol = "users";
  var galData = {
    "username" : "testuser",
    "email" : "testuser@vacation.com",
    "password" : "$2a$10$oU2WWLC8339f4F.A.bb4/.4hpDH9mZZMkdSZtGUckS7LBC8nGOFsG",
    "gallery" : mainGal,
    "groups" : ["top50", "cars"]
    };
  MongoTools.insertOne(galCol, galData, function(cb) {
    console.log("User added, ref:", cb);
  });
}
insertImages();
