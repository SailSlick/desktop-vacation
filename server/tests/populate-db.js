const MongoTools = require('../../server/middleware/db');

const dbConnI = new MongoTools('images');
const dbConnG = new MongoTools('galleries');
const dbConnU = new MongoTools('users');

function users(mainGal) {
  // insert users
  // pw is testuser1
  const galData = {
    username: 'testuser',
    password: '$2a$10$oU2WWLC8339f4F.A.bb4/.4hpDH9mZZMkdSZtGUckS7LBC8nGOFsG',
    gallery: mainGal,
    groups: ['top50', 'cars']
  };
  dbConnU.insertOne(galData, (cb) => {
    console.log('User added, ref:', cb);
    process.exit(0);
  });
}

function galleries2(imageRefs, galleryRefs) {
  // insert the gallery for the main user
  const galData2 = {
    name: 'testuser_all',
    tags: ['blam'],
    subgallaries: galleryRefs,
    images: imageRefs
  };
  dbConnG.insertOne(galData2, (cb) => {
    console.log('Galleries added, main ref:', cb);
    users(cb);
  });
}

function galleries1(imageRefs) {
  // insert sub-galleries
  const galData = [{
    name: 'phone',
    tags: ['oohlaala'],
    subgallaries: [],
    images: imageRefs.slice(0, 3)
  }, {
    name: 'winter',
    tags: ['oohlaala'],
    subgallaries: [],
    images: imageRefs.slice(0, 2)
  }];
  dbConnG.insertMany(galData, (cb) => {
    console.log('sub gallery refs:', cb);
    galleries2(imageRefs, cb);
  });
}

function insertImages() {
  // insert Images
  const imageData = [{
    hash: '34123187ndf9813fhq9348',
    metadata: { rating: 3, tags: ['winter', 'chill'] },
    location: '/home/1.png'
  }, {
    hash: '34123187ndf9813fhq9348',
    metadata: { rating: 1, tags: ['winter', 'chill'] },
    location: '/home/2.png'
  }, {
    hash: '34123187ndf9813fhq9348',
    metadata: { rating: 3, tags: ['winter', 'chill'] },
    location: '/home/3.png'
  }, {
    hash: '34123187ndf9813fhq9348',
    metadata: { rating: 4, tags: ['summer', 'chill'] },
    location: '/home/4.png'
  }];
  dbConnI.insertMany(imageData, (cb) => {
    console.log('Images added, refs:', cb);
    galleries1(cb);
  });
}

// Wait for all the connections to be ready
let i = 3;

function connReady() {
  i--;
  if (i === 0) {
    return insertImages();
  }
  return false;
}

dbConnI.onLoad = connReady;
dbConnG.onLoad = connReady;
dbConnU.onLoad = connReady;
