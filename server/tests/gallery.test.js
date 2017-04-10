const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');
const MongoTools = require('../middleware/db');

const galleryDB = new MongoTools('galleries');

chai.should();
chai.use(chaiHttp);

describe('Gallery API', () => {
  const agent = chai.request.agent(app);
  const username = 'morty_c137';
  const password = 'awh jeez I dunno rick';
  let uid;
  let gid;

  const testBody = {
    gallery: {
      uid,
      name: 'Szechuan Sightings',
      users: [],
      subgalleries: [],
      images: [],
      metadata: {
        rating: 5,
        tags: ['mcdonalds', 'mulan', 'szechuan', 'teryaki', 'series arc']
      }
    }
  };

  before((done) => {
    galleryDB.onLoad = () =>
      agent
        .post('/user/create')
        .send({ username, password })
        .end((_err, res) => {
          uid = res.body.uid;
          testBody.gallery.uid = uid;
          done();
        });
  });

  after((done) => {
    agent
      .post('/user/delete')
      .send({})
      .end(() => done());
  });

  describe('/gallery/upload', () => {
    const url = '/gallery/upload';

    it('should reject empty requests', (done) => {
      agent
        .post(url)
        .end((err, res) => {
          res.status.should.equal(400);
          res.body.should.be.a('object');
          res.body.error.should.equal('invalid gallery object');
          done();
        });
    });

    it('should reject invalid galleries', (done) => {
      testBody.gallery.metadata.hacks = ['wat'];
      testBody.gallery.images = [1234];
      agent
        .post(url)
        .end((err, res) => {
          testBody.gallery.images = [];
          delete testBody.gallery.metadata.hacks;
          res.status.should.equal(400);
          res.body.should.be.a('object');
          res.body.error.should.equal('invalid gallery object');
          done();
        });
    });

    it('should reject galleries with mismatching uids', (done) => {
      testBody.gallery.uid = testBody.gallery.uid.replace('a', 'f');
      agent
        .post(url)
        .send(testBody)
        .end((err, res) => {
          testBody.gallery.uid = uid;
          res.status.should.equal(401);
          res.body.should.be.a('object');
          res.body.error.should.equal('uid of gallery does not match user');
          done();
        });
    });

    it('should accept and upload valid galleries', (done) => {
      agent
        .post(url)
        .send(testBody)
        .end((err, res) => {
          res.status.should.equal(200);
          res.body.should.be.a('object');
          res.body.should.have.property('gid');
          res.body.message.should.equal('gallery uploaded');
          testBody.gallery.remoteId = res.body.gid;
          gid = res.body.gid;
          done();
        });
    });

    it('should not fail fatally on unchanged galleries', (done) => {
      agent
        .post(url)
        .send(testBody)
        .end((err, res) => {
          res.status.should.equal(200);
          res.body.should.be.a('object');
          res.body.should.have.property('gid');
          res.body.message.should.equal('gallery not updated');
          done();
        });
    });

    it('should be able to update galleries', (done) => {
      testBody.gallery.metadata.rating = 4;
      agent
        .post(url)
        .send(testBody)
        .end((err, res) => {
          res.status.should.equal(200);
          res.body.should.be.a('object');
          res.body.should.have.property('gid');
          res.body.message.should.equal('gallery updated');
          done();
        });
    });
  });

  describe('/gallery/id', () => {
    it('should reject invalid GIDs', (done) => {
      agent
        // This is invalid (contains a 'g')
        .get('/gallery/58ea915cfbfeg415a805587b')
        .end((err, res) => {
          res.status.should.equal(400);
          res.body.should.be.a('object');
          res.body.error.should.equal('invalid gid');
          done();
        });
    });

    it('should 404 safely on non-existant galleries', (done) => {
      agent
        // This is invalid (contains a 'g')
        .get('/gallery/' + gid.replace('a', 'f'))
        .end((err, res) => {
          res.status.should.equal(404);
          res.body.should.be.a('object');
          res.body.error.should.equal('gallery doesn\'t exist');
          done();
        });
    });

    it('should return the same gallery', (done) => {
      agent
        .get('/gallery/' + gid)
        .end((err, res) => {
          res.status.should.equal(200);
          res.body.should.be.a('object');
          res.body.message.should.equal('gallery found');
          const newGal = res.body.data;
          const ourGal = testBody.gallery;
          newGal.name.should.equal(ourGal.name);
          newGal.metadata.should.deep.equal(ourGal.metadata);
          newGal.images.should.deep.equal(ourGal.images);
          newGal.subgalleries.should.deep.equal(ourGal.subgalleries);
          newGal.users.should.deep.equal(ourGal.users);
          done();
        });
    });
  });

  describe('/gallery/id/remove', () => {
    it('should reject invalid GIDs', (done) => {
      agent
        // This is invalid (contains a 'g')
        .post('/gallery/58ea915cfbfeg415a805587b/remove')
        .end((err, res) => {
          res.status.should.equal(400);
          res.body.should.be.a('object');
          res.body.error.should.equal('invalid gid');
          done();
        });
    });

    it('should 500 on non-existant galleries', (done) => {
      agent
        // This is invalid (contains a 'g')
        .post('/gallery/' + gid.replace('a', 'f') + '/remove')
        .end((err, res) => {
          res.status.should.equal(500);
          res.body.should.be.a('object');
          res.body.error.should.equal('gallery not found');
          done();
        });
    });

    it('should successfully remove gallery', (done) => {
      agent
        .post('/gallery/' + gid + '/remove')
        .end((err, res) => {
          res.status.should.equal(200);
          res.body.should.be.a('object');
          res.body.message.should.equal('gallery removed');
          done();
        });
    });
  });
});
