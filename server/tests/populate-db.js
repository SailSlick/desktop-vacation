const MongoTools = require('../../server/middleware/db');

const dbConnI = new MongoTools('images');
const dbConnG = new MongoTools('galleries');
const dbConnU = new MongoTools('users');

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
  // insert Images
  const imageData = [{
    hash: '34123187ndf9813fhq9348',
    uid: userId,
    metadata: { rating: 3, tags: ['winter', 'chill'] },
    location: '/home/1.png'
  }, {
    hash: '34123187ndf9813fhq9348',
    uid: userId,
    metadata: { rating: 1, tags: ['winter', 'chill'] },
    location: '/home/2.png'
  }, {
    hash: '34123187ndf9813fhq9348',
    uid: userId,
    metadata: { rating: 3, tags: ['winter', 'chill'] },
    location: '/home/3.png'
  }, {
    hash: '34123187ndf9813fhq9348',
    uid: userId,
    metadata: { rating: 4, tags: ['summer', 'chill'] },
    location: '/home/4.png'
  }];
  dbConnI.insertMany(imageData, (cb) => {
    console.log('Images added, refs:', cb);
    galleries1(cb, userId);
  });
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
let i = 3;

function connReady() {
  i--;
  if (i === 0) {
    dbConnI.removeMany({}, () => true);
    dbConnG.removeMany({}, () => true);
    dbConnU.removeMany({}, () => true);
    return users();
  }
  return false;
}

dbConnI.onLoad = connReady;
dbConnG.onLoad = connReady;
dbConnU.onLoad = connReady;
