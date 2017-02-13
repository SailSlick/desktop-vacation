const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');
const MongoTools = require('../middleware/db');

const userDB = new MongoTools('users');
const should = chai.should();
chai.use(chaiHttp);

describe('User API', () => {
  const username = 'test_poopfeast420_never_use_plz';
  const password = 'chrishansenwashere';
  describe('/user/create', () => {
    it('should reject username with space', (done) => {
      const user = {
        username: 'hello world',
        password: '123987394729384709'
      };
      chai.request(app)
        .post('/user/create')
        .send(user)
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('invalid username');
          done();
        });
    });

    it('should reject a request with no password', (done) => {
      const user = { username };
      chai.request(app)
        .post('/user/create')
        .send(user)
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('invalid password');
          done();
        });
    });

    it('should reject a blank request', (done) => {
      const user = {};
      chai.request(app)
        .post('/user/create')
        .send(user)
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('invalid username and invalid password');
          done();
        });
    });

    it('should accept a valid request', (done) => {
      const user = {
        username,
        password: 'nottoolongnotoshortwoo'
      };
      chai.request(app)
        .post('/user/create')
        .send(user)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.message.should.equal('user created and logged in');
          done();
        });
    });

    after((done) => {
      userDB.removeOne({ username }, () => { done(); });
    });
  });

  describe('/user/login', () => {
    before((done) => {
      chai.request(app)
        .post('/user/create')
        .send({ username, password })
        .end((_err, _res) => { done(); });
    });

    it('should be not login with incorrect password', (done) => {
      chai.request(app)
        .post('/user/login')
        .send({ username, password: 'this_sholdnot_connect' })
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('incorrect credentials');
          done();
        });
    });

    it('should be not login with incorrect username', (done) => {
      chai.request(app)
        .post('/user/login')
        .send({ username: 'wowee', password })
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('incorrect credentials');
          done();
        });
    });

    it('should be not login with blank request', (done) => {
      chai.request(app)
        .post('/user/login')
        .send({})
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('incorrect credentials');
          done();
        });
    });

    it('should be able to login with correct credentials', (done) => {
      chai.request(app)
        .post('/user/login')
        .send({ username, password })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.message.should.equal('user logged in');
          done();
        });
    });

    after((done) => {
      userDB.removeOne({ username }, () => { done(); });
    });
  });

  describe('/user/logout', () => {
    const agent = chai.request.agent(app);

    before((done) => {
      agent
        .post('/user/create')
        .send({ username, password })
        .end(() => { done(); });
    });

    it('should be able to logout', (done) => {
      agent
        .post('/user/logout')
        .send({})
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.message.should.equal('user logged out');
          done();
        });
    });

    it('should not to be able to logout when not logged in', (done) => {
      chai.request(app)
        .post('/user/logout')
        .send({ username, password })
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('not logged in');
          done();
        });
    });

    after((done) => {
      agent
        .post(('/user/logout'))
        .end((_err, _res) => {
          userDB.removeOne({ username }, () => { done(); });
        });
    });
  });

  describe('/user/update', () => {
    const agent = chai.request.agent(app);

    before((done) => {
      agent
        .post('/user/create')
        .send({ username, password })
        .end((_err, _res) => { done(); });
    });

    it('should not be able to update to password too short', (done) => {
      agent
        .post('/user/update')
        .send({ username, password: 'e' })
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('invalid password');
          done();
        });
    });

    it('should be able to update password', (done) => {
      const new_pass = 'this_is_a_fine_password';
      agent
        .post('/user/update')
        .send({ username, password: new_pass })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.message.should.equal('user updated');
          done();
        });
    });

    it('should not to be able to update when not logged in', (done) => {
      chai.request(app)
        .post('/user/update')
        .send({ username, password: 'wow' })
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('not logged in');
          done();
        });
    });

    after((done) => {
      agent
        .post(('/user/logout'))
        .end((_err, _res) => {
          userDB.removeOne({ username }, () => { done(); });
        });
    });
  });

  describe('/user/delete', () => {
    const agent = chai.request.agent(app);

    before((done) => {
      agent
        .post('/user/create')
        .send({ username, password })
        .end((_err, _res) => { done(); });
    });

    it('should be delete user', (done) => {
      agent
        .post('/user/delete')
        .send({})
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.message.should.equal('user deleted');
          done();
        });
    });

    it('should not to be able to delete when not logged in', (done) => {
      chai.request(app)
        .post('/user/delete')
        .send({ username, password })
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('not logged in');
          done();
        });
    });
  });
});
