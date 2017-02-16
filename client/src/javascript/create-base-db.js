const path = require('path');
const Loki = require('lokijs');

const db = new Loki(path.join(__dirname, '../../app/userData/vacation.json'));
console.log(__dirname);

const galleries = db.addCollection('galleries');
const host = db.addCollection('host');
db.addCollection('images');

const hostname = 'Sully';


function makeHost(mainGal) {
  // insert users
  const userData = {
    username: hostname,
    gallery: mainGal,
    slideshowConfig: {
      onstart: false,
      galleryname: hostname.concat('_all'),
      timer: 0
    }
  };
  const hostEntry = host.insert(userData);
  console.log('host added, details:', hostEntry);
  console.log('dbsave');
  db.saveDatabase(() => process.exit(0));
}

function makeGallery() {
  // insert users
  const galname = hostname.concat('_all');
  const galleryData = {
    name: galname,
    tags: [],
    subgallaries: [],
    images: []
  };
  const mainGal = galleries.insert(galleryData);
  console.log('Gallery added, details:', mainGal);
  makeHost(mainGal.$loki);
}

makeGallery();
