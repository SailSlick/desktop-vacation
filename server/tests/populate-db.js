const MongoTools = require('../../server/middleware/db');

const dbConnG = new MongoTools('galleries');
const dbConnU = new MongoTools('users');
const dbConnC = new MongoTools('fs.chunks');
const dbConnF = new MongoTools('fs.files');
const dbConnS = new MongoTools('session');

function updateUsers(mainGal, userId) {
  const userQuery = { _id: userId };
  const userData = { gallery: mainGal };
  dbConnU.updateOne(userQuery, userData, (cb) => {
    console.log('User updated, result:', cb);
    process.exit(0);
  });
}

function galleries2(imageRefs, galleryRefs, userId) {
  // insert the gallery for the main user
  const galData2 = {
    name: 'testuser_all',
    uid: userId,
    users: [],
    subgallaries: galleryRefs,
    images: imageRefs,
    metadata: {
      rating: 0,
      tags: []
    }
  };
  dbConnG.insertOne(galData2, (cb) => {
    console.log('Galleries added, main ref:', cb);
    updateUsers(cb, userId);
  });
}

function galleries1(imageRefs, userId) {
  // insert sub-galleries
  const galData = [{
    name: 'phone',
    uid: userId,
    users: [],
    subgallaries: [],
    images: imageRefs.slice(0, 3),
    metadata: {
      rating: 0,
      tags: []
    }
  }, {
    name: 'winter',
    uid: userId,
    users: [],
    subgallaries: [],
    images: imageRefs.slice(0, 2),
    metadata: {
      rating: 0,
      tags: []
    }
  }];
  dbConnG.insertMany(galData, (cb) => {
    console.log('sub gallery refs:', cb);
    galleries2(imageRefs, cb, userId);
  });
}

function insertImages(userId) {
  // insert images... eventually :)
  galleries1([], userId);
}

function users(mainGal) {
  // insert users
  // pw is testuser1
  const userData = {
    username: 'testuser',
    password: '$2a$10$oU2WWLC8339f4F.A.bb4/.4hpDH9mZZMkdSZtGUckS7LBC8nGOFsG',
    gallery: mainGal,
    groups: [],
    invites: []
  };
  dbConnU.insertOne(userData, (cb) => {
    console.log('User added, ref:', cb);
    insertImages(cb);
  });
}

// Wait for all the connections to be ready
let i = 5;

function connReady() {
  i--;
  if (i === 0) {
    dbConnG.removeMany({}, () => true);
    dbConnU.removeMany({}, () => true);
    dbConnC.removeMany({}, () => true);
    dbConnF.removeMany({}, () => true);
    dbConnS.removeMany({}, () => true);
    return users();
  }
  return false;
}

dbConnG.onLoad = connReady;
dbConnU.onLoad = connReady;
dbConnC.onLoad = connReady;
dbConnF.onLoad = connReady;
dbConnS.onLoad = connReady;
