const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');

chai.should();
chai.use(chaiHttp);

describe('Sync API', () => {
  const agent = chai.request.agent(app);
  const username = 'rick_sanchez';
  const password = 'that mulan szechuan teriyaki dipping sauce morty';
  const testImagePath = 'tests/test_image.jpg';
  let baseGalleryId = '';
  let imageId = '';

  before((done) => {
    agent
      .post('/user/create')
      .send({ username, password })
      .end((_err, res) => {
        baseGalleryId = res.body['root-remote-id'];
        done();
      });
  });

  after((done) => {
    agent
      .post('/user/delete')
      .send({})
      .end(() => { done(); });
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

    it('should not allow an invalid id', (done) => {
      agent
      .post('/image/upload')
      .type('form')
      .field('gid', 'notvalid_id')
      .end((err, res) => {
        res.should.have.status(400);
        res.body.error.should.equal('invalid gallery id');
        done();
      });
    });

    it('should correctly respond to an request with no images', (done) => {
      agent
        .post('/image/upload')
        .type('form')
        .field('gid', baseGalleryId)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.message.should.equal('no images to upload');
          done();
        });
    });

    it('should correctly respond to an request with an image', (done) => {
      agent
        .post('/image/upload')
        .type('form')
        .field('gid', baseGalleryId)
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
  });

  describe('/image/:id - image download', () => {
    it('should fail for an invalid image id', (done) => {
      agent
      .get('/image/1337')
      .end((err, res) => {
        res.should.have.status(400);
        res.body.error.should.equal('cannot find image');
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

    it('should download a valid image id', (done) => {
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
        done();
      });
    });

    it('should no longer be able to get the removed image', (done) => {
      agent
      .get(`/image/${imageId}`)
      .end((err, res) => {
        res.should.have.status(400);
        res.body.error.should.equal('cannot find image');
        done();
      });
    });
  });
});
