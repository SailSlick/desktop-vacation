const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');
const images = require('../models/image');

const should = chai.should();
chai.use(chaiHttp);

describe('Image API', () => {
  const agent = chai.request.agent(app);
  const username = 'rick_sanchez';
  const password = 'that mulan szechuan teriyaki dipping sauce morty';
  const agent2 = chai.request.agent(app);
  const username2 = 'huh';
  const testImagePath = 'tests/test_image.jpg';
  const testImage2Path = 'tests/test_image2.jpg';
  let imageId = '';
  let imageId2 = '';
  let uid = '';
  let uid2 = '';

  before((done) => {
    agent
      .post('/user/create')
      .send({ username, password })
      .end((_err, res) => {
        res.body.status.should.equal(200);
        uid = res.body.uid;
        agent2
          .post('/user/create')
          .send({ username: username2, password })
          .end((_err2, res2) => {
            res2.status.should.equal(200);
            uid2 = res2.body.uid;
            done();
          });
      });
  });

  after((done) => {
    agent
      .post('/user/delete')
      .send({})
      .end(() => {
        agent2
          .post('/user/delete')
          .send({})
          .end(() => { done(); });
      });
  });

  describe('/image/upload', () => {
    it('should not allow a blank request', (done) => {
      agent
      .post('/image/upload')
      .send({})
      .end((err, res) => {
        res.should.have.status(400);
        res.body.error.should.equal('invalid request');
        done();
      });
    });

    it('should not allow more images than metadatas', (done) => {
      agent
        .post('/image/upload')
        .type('form')
        .attach('images', testImagePath)
        .field('metadatas', JSON.stringify([]))
        .field('hashes', JSON.stringify([]))
        .end((err, res) => {
          res.should.have.status(400);
          res.body.error.should.equal('invalid request');
          done();
        });
    });

    it('should correctly respond to a request with an image', (done) => {
      agent
        .post('/image/upload')
        .type('form')
        .field('metadatas', '[{"rating":4,"tags":[]}]')
        .field('hashes', '["34125345hkj14jk2h3k524kv"]')
        .attach('images', testImagePath)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('image-ids');
          res.body.message.should.equal('images uploaded');
          res.body['image-ids'].should.have.lengthOf(1);
          imageId = res.body['image-ids'][0];
          done();
        });
    });

    it('should correctly respond to a request with an image and it shouldn\'t make it a dup', (done) => {
      agent
        .post('/image/upload')
        .type('form')
        .field('metadatas', '[{"rating":4,"tags":[]}]')
        .field('hashes', '["differntHashToTheOneAbove"]')
        .attach('images', testImage2Path)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('image-ids');
          res.body.message.should.equal('images uploaded');
          res.body['image-ids'].should.have.lengthOf(1);
          images.fsGet('differntHashToTheOneAbove', (getErr, doc) => {
            doc.should.exist;
            should.not.exist(getErr);
            done();
          });
        });
    });

    it('should not duplicate an image', (done) => {
      agent2
        .post('/image/upload')
        .type('form')
        .field('metadatas', '[{"rating":4,"tags":[]}]')
        .field('hashes', '["34125345hkj14jk2h3k524kv"]')
        .attach('images', testImagePath)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('image-ids');
          res.body.message.should.equal('images uploaded');
          res.body['image-ids'].should.have.lengthOf(1);
          imageId2 = res.body['image-ids'][0];
          images.get(uid, imageId, (findErr, image1) => {
            images.get(uid2, imageId2, (findErr2, image2) => {
              image1.location.should.equal(image2.location);
              done();
            });
          });
        });
    });
  });

  describe('/image/:id - image download', () => {
    it('should fail for an invalid image id', (done) => {
      agent
      .get('/image/1337')
      .end((err, res) => {
        res.should.have.status(404);
        res.body.error.should.equal('image not found');
        done();
      });
    });

    it('should download a valid image id', (done) => {
      agent
      .get(`/image/${imageId}`)
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
    });

    it('should not be able to download an unshared image', (done) => {
      chai.request(app)
      .get(`/image/${imageId}`)
      .end((err, res) => {
        res.should.have.status(401);
        done();
      });
    });
  });

  describe('/image/:id/share', () => {
    it('should fail for an invalid image id', (done) => {
      agent
      .post('/image/1337/share')
      .end((err, res) => {
        res.should.have.status(400);
        res.body.error.should.equal('failure to share image');
        done();
      });
    });

    it('should succeed for a valid image id', (done) => {
      agent
      .post(`/image/${imageId}/share`)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.message.should.equal('image shared');
        done();
      });
    });

    it('should succeed for an already shared image', (done) => {
      agent
      .post(`/image/${imageId}/share`)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.message.should.equal('image shared');
        done();
      });
    });

    it('should be able to download a shared image with no login', (done) => {
      chai.request(app)
      .get(`/image/${imageId}`)
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
    });
  });

  describe('/image/:id/unshare', () => {
    it('should fail for an invalid id', (done) => {
      agent
      .post('/image/1337/unshare')
      .end((err, res) => {
        res.should.have.status(400);
        res.body.error.should.equal('failure to unshare image');
        done();
      });
    });

    it('should succeed for an already shared image', (done) => {
      agent
      .post(`/image/${imageId}/unshare`)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.message.should.equal('image unshared');
        done();
      });
    });

    it('should succeed for an already unshared image', (done) => {
      agent
      .post(`/image/${imageId}/unshare`)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.message.should.equal('image unshared');
        done();
      });
    });

    it('should not be able to download a shared image with no login', (done) => {
      chai.request(app)
      .get(`/image/${imageId}`)
      .end((err, res) => {
        res.should.have.status(401);
        done();
      });
    });
  });

  describe('/image/:id/remove', () => {
    it('should fail to remove an invalid image id', (done) => {
      agent
      .post('/image/1337/remove')
      .end((_err, res) => {
        res.should.have.status(400);
        res.body.error.should.equal('invalid request, or invalid permissions');
        done();
      });
    });

    it('should succeed to remove a valid image id', (done) => {
      agent
      .post(`/image/${imageId}/remove`)
      .end((_err, res) => {
        res.should.have.status(200);
        res.body.message.should.equal('image deleted');
        images.fsGet('34125345hkj14jk2h3k524kv', (err, doc) => {
          should.not.exist(err);
          doc.should.exist;
          done();
        });
      });
    });

    it('should no longer be able to get the removed image', (done) => {
      agent
      .get(`/image/${imageId}`)
      .end((err, res) => {
        res.should.have.status(404);
        res.body.error.should.equal('image not found');
        done();
      });
    });

    it('should be able to download deduped image if it hasn\'t been wiped from fs', (done) => {
      agent2
      .get(`/image/${imageId2}`)
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
    });

    it('should be able to wipe a duped image', (done) => {
      agent2
      .post(`/image/${imageId2}/remove`)
      .end((_err, res) => {
        res.should.have.status(200);
        res.body.message.should.equal('image deleted');
        images.fsGet('34125345hkj14jk2h3k524kv', (err, doc) => {
          err.should.exist;
          should.not.exist(doc);
          done();
        });
      });
    });
  });
});
