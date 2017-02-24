const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');
const MongoTools = require('../middleware/db');

const galleryDB = new MongoTools('galleries');
chai.should();
chai.use(chaiHttp);

describe('Group API', () => {
  const agent = chai.request.agent(app);
  const username = 'test_user_for_group';
  const password = 'test_pw_for_group';
  const groupname = 'hotchoco';


  const testAgent = chai.request.agent(app);
  const username2 = 'test_user_for_group2';
  const password2 = 'test_pw_for_group2';

  const uid = before((done) => {
    agent
      .post('/user/create')
      .send({ username, password })
      .end((_err, _res) => {
        testAgent
          .post('/user/create')
          .send({ username2, password2 })
          .end((_err2, _res2) => { done(); });
      });
  });

  describe('/group/create', () => {
    it('should reject groupname over 20 chars', (done) => {
      agent
        .post('/group/create')
        .send({ groupname: 'overtwentychars123456789', uid })
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('invalid groupname');
          done();
        });
    });

    it('should reject a request not logged in', (done) => {
      chai.request(app)
        .post('/group/create')
        .send({ groupname, uid })
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('not logged in');
          done();
        });
    });

    it('should reject a blank request', (done) => {
      chai.request(app)
        .post('/group/create')
        .send({})
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('invalid groupname');
          done();
        });
    });

    it('should accept a valid request', (done) => {
      agent
        .post('/group/create')
        .send({ groupname, uid })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.message.should.equal('group created');
          done();
        });
    });

    after((done) => {
      galleryDB.removeOne({ groupname, uid }, () => { done(); });
    });
  });

  describe('/group/delete', () => {
    before((done) => {
      chai.request(app)
        .post('/group/create')
        .send({ groupname, uid })
        .end((_err, _res) => { done(); });
    });

    it('should reject delete for non existent gallery', (done) => {
      chai.request(app)
        .post('/group/delete')
        .send({ groupname: 'tomtotmotm', uid })
        .end((err, res) => {
          res.should.have.status(404);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('group doesn\'t exist');
          done();
        });
    });

    it('should reject if you don\'t have permission', (done) => {
      chai.request(app)
        .post('/group/delete')
        .send({ groupname, uid: 12343324 })
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('incorrect permissions for group');
          done();
        });
    });

    it('should reject delete with blank request', (done) => {
      chai.request(app)
        .post('/group/delete')
        .send({})
        .end((err, res) => {
          res.should.have.status(404);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('group doesn\'t exist');
          done();
        });
    });

    it('should be able to delete with correct name', (done) => {
      chai.request(app)
        .post('/group/delete')
        .send({ groupname, uid })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.message.should.equal('group deleted');
          done();
        });
    });

    after((done) => {
      galleryDB.removeOne({ groupname, uid }, () => { done(); });
    });
  });

  describe('/group', () => {
    before((done) => {
      agent
        .post('/group/create')
        .send({ groupname, uid })
        .end(() => { done(); });
    });

    it('should be able to get all the groups', (done) => {
      agent
        .get('/group')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.message.should.equal('user groups found');
          res.body.should.have.property('data');
          res.body.data.should.have.lengthOf(1);
          done();
        });
    });

    after((done) => {
      galleryDB.removeOne({ groupname, uid }, () => { done(); });
    });
  });

  describe('/group/user/invite', () => {
    before((done) => {
      agent
        .post('/group/create')
        .send({ groupname, uid })
        .end((_err, _res) => { done(); });
    });

    it('should not be invite to non-existent group', (done) => {
      agent
        .post('/group/user/invite')
        .send({ groupname: 'hooo', username })
        .end((err, res) => {
          res.should.have.status(404);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('group doesn\'t exist');
          done();
        });
    });

    it('should not be able to invite non-existent user', (done) => {
      agent
        .post('/group/user/invite')
        .send({ groupname, username: 'clearly_not_username h' })
        .end((err, res) => {
          res.should.have.status(404);
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.message.should.equal('user doesn\'t exist');
          done();
        });
    });

    it('should not allow anyone to invite', (done) => {
      testAgent
        .post('/user/update')
        .send({ groupname, username })
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('incorrect permissions for group');
          done();
        });
    });

    it('should be able to invite user', (done) => {
      agent
        .post('/group/user/invite')
        .send({ groupname, username2 })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.message.should.equal('user invited to group');
          done();
        });
    });

    after((done) => {
      galleryDB.removeOne({ groupname, uid }, () => { done(); });
    });
  });

  describe('/group/user/remove', () => {
    before((done) => {
      agent
        .post('/group/create')
        .send({ groupname, uid })
        .end((_err, _res) => { done(); });
    });

    it('should not be remove from non-existent group', (done) => {
      agent
        .post('/group/user/remove')
        .send({ groupname: 'hooo', username })
        .end((err, res) => {
          res.should.have.status(404);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('group doesn\'t exist');
          done();
        });
    });

    it('should not be able to remove non-member user', (done) => {
      agent
        .post('/group/user/remove')
        .send({ groupname, username: 'clearly_not_username h' })
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.message.should.equal('user isn\'t member of group');
          done();
        });
    });

    it('should not be able delete user without permissions', (done) => {
      testAgent
        .post('/group/user/remove')
        .send({ groupname, username })
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.message.should.equal('incorrect permissions for group');
          done();
        });
    });

    it('should not to be able to remove when not logged in', (done) => {
      chai.request(app)
        .post('/group/user/remove')
        .send({ groupname, username2 })
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('not logged in');
          done();
        });
    });

    it('should be able to remove ordinary user', (done) => {
      agent
        .post('/group/user/remove')
        .send({ groupname, username2 })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('user removed from group');
          done();
        });
    });

    it('should be able to remove yourself if not owner', (done) => {
      testAgent
        .post('/group/user/remove')
        .send({ groupname, username2 })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('user removed from group');
          done();
        });
    });

    it('should not to be able to remove owner', (done) => {
      agent
        .post('/group/user/remove')
        .send({ groupname, username })
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('user is owner of the group');
          done();
        });
    });

    after((done) => {
      galleryDB.removeOne({ groupname, uid }, () => { done(); });
    });
  });

  describe('/group/user/join', () => {
    before((done) => {
      agent
        .post('/group/create')
        .send({ groupname, uid })
        .end((_err, _res) => {
          agent
            .post('/group/user/invite')
            .send({ groupname, username2 })
            .end((_err2, _res2) => {
              agent
                .post('/group/create')
                .send({ groupname: 'the real group', uid })
                .end((_err3, _res3) => { done(); });
            });
        });
    });

    it('should not be join non-existent group', (done) => {
      testAgent
        .post('/group/user/join')
        .send({ groupname: 'hooo' })
        .end((err, res) => {
          res.should.have.status(404);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('group doesn\'t exist');
          done();
        });
    });

    it('should not be able to join without invite', (done) => {
      testAgent
        .post('/group/user/join')
        .send({ groupname: 'the real group' })
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.message.should.equal('user isn\'t invited to group');
          done();
        });
    });

    it('should be able to join group', (done) => {
      testAgent
        .post('/group/user/join')
        .send({ groupname })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.message.should.equal('user has joined the group');
          done();
        });
    });

    it('should not be able to join twice', (done) => {
      agent
        .post('/group/user/invite')
        .send({ groupname, username2 })
        .end((_err2, _res2) => {
          testAgent
            .post('/user/update')
            .send({ groupname, username })
            .end((err, res) => {
              res.should.have.status(400);
              res.body.should.be.a('object');
              res.body.should.have.property('error');
              res.body.error.should.equal('user is already member of group');
              done();
            });
        });
    });

    after((done) => {
      galleryDB.removeMany({ uid }, () => { done(); });
    });
  });

  describe('/group/user/refuse', () => {
    before((done) => {
      agent
        .post('/group/create')
        .send({ groupname, uid })
        .end((_err, _res) => {
          agent
            .post('/group/user/invite')
            .send({ groupname, username2 })
            .end((_err2, _res2) => {
              agent
                .post('/group/create')
                .send({ groupname: 'the real group', uid })
                .end((_err3, _res3) => { done(); });
            });
        });
    });

    it('should not be able to refuse without invite', (done) => {
      testAgent
        .post('/group/user/refuse')
        .send({ groupname: 'the real group' })
        .end((err, res) => {
          res.should.have.status(404);
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.message.should.equal('invitation doesn\'t exist');
          done();
        });
    });

    it('should be able to refuse', (done) => {
      testAgent
        .post('/group/user/refuse')
        .send({ groupname })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.message.should.equal('user has refused invitation');
          done();
        });
    });

    after((done) => {
      galleryDB.removeOne({ uid }, () => { done(); });
    });
  });

  after((done) => {
    agent
      .post(('/user/delete'))
      .send({})
      .end((_err, _res) => {
        testAgent
          .post(('/user/delete'))
          .send({})
          .end((_err2, _res2) => { done(); });
      });
  });
});
