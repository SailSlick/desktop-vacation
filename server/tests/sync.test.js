const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');

chai.should();
chai.use(chaiHttp);

describe('Images API', () => {
  const agent = chai.request.agent(app);
  const username = 'rick_sanchez';
  const password = 'that mulan szechuan teriyaki dipping sauce morty';
  const testImagePath = 'tests/test_image.jpg';
  let baseGalleryId = '';

  before((done) => {
    agent
      .post('/user/create')
      .send({ username, password })
      .end((_err, res) => {
        baseGalleryId = res.body['root-remote-id'];
        console.log(baseGalleryId);
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
          res.body.error.should.equal('no files sent');
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
          done();
        });
    });
  });

  describe('/image/<id>', () => {
    it('should download a valid image id', (done) => {
      done();
    });
  });
});
