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

  before((done) => {
    galleryDB.onLoad = () => {
      console.log('group', galleryDB.col.s.name);
      agent
        .post('/user/create')
        .send({ username, password })
        .end((_err, _res) => {
          testAgent
            .post('/user/create')
            .send({ username: username2, password: password2 })
            .end((_err2, _res2) => { done(); });
        });
    };
  });
  describe('/group/create', () => {
    it('should reject groupname over 20 chars', (done) => {
      agent
        .post('/group/create')
        .send({ groupname: 'overtwentychars123456789' })
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
        .send({ groupname })
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('not logged in');
          done();
        });
    });

    it('should reject a blank request', (done) => {
      agent
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
        .send({ groupname })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.message.should.equal('group created');
          done();
        });
    });

    after((done) => {
      galleryDB.findOne({ name: groupname }, (doc) => {
        galleryDB.removeOne({ name: groupname, uid: doc.uid }, () => { done(); });
      });
    });
  });

  describe('/group/delete', () => {
    before((done) => {
      agent
        .post('/group/create')
        .send({ groupname })
        .end((_err, _res) => { done(); });
    });

    it('should reject delete for non existent gallery', (done) => {
      agent
        .post('/group/delete')
        .send({ gid: '58aff53d6de1e9214295308a' })
        .end((err, res) => {
          res.should.have.status(404);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('group doesn\'t exist');
          done();
        });
    });

    it('should reject if you don\'t have permission', (done) => {
      galleryDB.findOne({ name: groupname }, (doc) => {
        testAgent
          .post('/group/delete')
          .send({ gid: doc._id })
          .end((err, res) => {
            res.should.have.status(401);
            res.body.should.be.a('object');
            res.body.should.have.property('error');
            res.body.error.should.equal('incorrect permissions for group');
            done();
          });
      });
    });

    it('should reject delete with blank request', (done) => {
      agent
        .post('/group/delete')
        .send({})
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('invalid gid');
          done();
        });
    });

    it('should be able to delete with gid', (done) => {
      galleryDB.findOne({ name: groupname }, (doc) => {
        agent
          .post('/group/delete')
          .send({ gid: doc._id })
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('message');
            res.body.message.should.equal('gallery removed');
            done();
          });
      });
    });

    after((done) => {
      galleryDB.findOne({ name: groupname }, (doc) => {
        if (doc) {
          galleryDB.removeOne({ name: groupname, uid: doc.uid }, () => { done(); });
        }
        done();
      });
    });
  });

  describe('/group', () => {
    before((done) => {
      agent
        .post('/group/create')
        .send({ groupname })
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
          res.body.data.should.have.property('subgalleries');
          res.body.data.subgalleries.should.have.lengthOf(2);
          done();
        });
    });

    after((done) => {
      galleryDB.findOne({ name: groupname }, (doc) => {
        galleryDB.removeOne({ name: groupname, uid: doc.uid }, () => { done(); });
      });
    });
  });

  describe('/group/user/invite', () => {
    before((done) => {
      agent
        .post('/group/create')
        .send({ groupname })
        .end((_err, _res) => { done(); });
    });

    it('should not be invite to non-existent group', (done) => {
      agent
        .post('/group/user/invite')
        .send({ gid: '58b2fb2d39f24c268f190769', username })
        .end((err, res) => {
          res.should.have.status(404);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('group doesn\'t exist');
          done();
        });
    });

    it('should not be able to invite non-existent user', (done) => {
      galleryDB.findOne({ name: groupname }, (doc) => {
        agent
          .post('/group/user/invite')
          .send({ gid: doc._id, username: 'clearly_not_username h' })
          .end((err, res) => {
            res.should.have.status(404);
            res.body.should.be.a('object');
            res.body.should.have.property('error');
            res.body.error.should.equal('user doesn\'t exist');
            done();
          });
      });
    });

    it('should not allow anyone to invite', (done) => {
      galleryDB.findOne({ name: groupname }, (doc) => {
        testAgent
          .post('/group/user/invite')
          .send({ gid: doc._id, username })
          .end((err, res) => {
            res.should.have.status(401);
            res.body.should.be.a('object');
            res.body.should.have.property('error');
            res.body.error.should.equal('incorrect permissions for group');
            done();
          });
      });
    });

    it('should be able to invite user', (done) => {
      galleryDB.findOne({ name: groupname }, (doc) => {
        agent
          .post('/group/user/invite')
          .send({ gid: doc._id, username: username2 })
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('message');
            res.body.message.should.equal('user invited to group');
            done();
          });
      });
    });

    it('should not be able to invite member of group', (done) => {
      galleryDB.findOne({ name: groupname }, (doc) => {
        testAgent
          .post('/group/user/join')
          .send({ groupname, gid: doc._id })
          .end((_err, _res) => {
            agent
              .post('/group/user/invite')
              .send({ gid: doc._id, username: username2 })
              .end((err2, res2) => {
                res2.should.have.status(400);
                res2.body.should.be.a('object');
                res2.body.should.have.property('error');
                res2.body.error.should.equal('user is already member of group');
                done();
              });
          });
      });
    });

    after((done) => {
      galleryDB.findOne({ name: groupname }, (doc) => {
        galleryDB.removeOne({ name: groupname, uid: doc.uid }, () => { done(); });
      });
    });
  });

  describe('/group/user/remove', () => {
    before((done) => {
      agent
        .post('/group/create')
        .send({ groupname })
        .end((_err, _res) => { done(); });
    });

    it('should not be remove from non-existent group', (done) => {
      agent
        .post('/group/user/remove')
        .send({ gid: '58b2fb2d39f24c268f190769', username })
        .end((err, res) => {
          res.should.have.status(404);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('group doesn\'t exist');
          done();
        });
    });

    it('should not be able to remove non-member user', (done) => {
      galleryDB.findOne({ name: groupname }, (doc) => {
        agent
          .post('/group/user/remove')
          .send({ gid: doc._id, username: username2 })
          .end((err, res) => {
            res.should.have.status(400);
            res.body.should.be.a('object');
            res.body.should.have.property('error');
            res.body.error.should.equal('user isn\'t member of group');
            done();
          });
      });
    });

    it('should not be able delete user without permissions', (done) => {
      galleryDB.findOne({ name: groupname }, (doc) => {
        agent
          .post('/group/user/invite')
          .send({ gid: doc._id, username: username2 })
          .end((_err, _res) => {
            testAgent
              .post('/group/user/join')
              .send({ groupname, gid: doc._id })
              .end((_err2, _res2) => {
                testAgent
                  .post('/group/user/remove')
                  .send({ gid: doc._id, username })
                  .end((_err3, res) => {
                    res.should.have.status(401);
                    res.body.should.be.a('object');
                    res.body.should.have.property('error');
                    res.body.error.should.equal('incorrect permissions for group');
                    done();
                  });
              });
          });
      });
    });

    it('should not to be able to remove when not logged in', (done) => {
      galleryDB.findOne({ name: groupname }, (doc) => {
        chai.request(app)
          .post('/group/user/remove')
          .send({ gid: doc._id, username: username2 })
          .end((err, res) => {
            res.should.have.status(401);
            res.body.should.be.a('object');
            res.body.should.have.property('error');
            res.body.error.should.equal('not logged in');
            done();
          });
      });
    });

    it('should be able to remove ordinary user', (done) => {
      galleryDB.findOne({ name: groupname }, (doc) => {
        agent
          .post('/group/user/remove')
          .send({ gid: doc._id, username: username2 })
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('message');
            res.body.message.should.equal('user removed from group');
            done();
          });
      });
    });

    it('should be able to remove yourself if not owner', (done) => {
      galleryDB.findOne({ name: groupname }, (doc) => {
        agent
          .post('/group/user/invite')
          .send({ gid: doc._id, username: username2 })
          .end((_err, _res) => {
            testAgent
              .post('/group/user/join')
              .send({ groupname, gid: doc._id })
              .end((_err2, _res2) => {
                testAgent
                  .post('/group/user/remove')
                  .send({ gid: doc._id, username: username2 })
                  .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message');
                    res.body.message.should.equal('user removed from group');
                    done();
                  });
              });
          });
      });
    });

    it('should not to be able to remove owner', (done) => {
      galleryDB.findOne({ name: groupname }, (doc) => {
        agent
          .post('/group/user/remove')
          .send({ gid: doc._id, username })
          .end((err, res) => {
            res.should.have.status(400);
            res.body.should.be.a('object');
            res.body.should.have.property('error');
            res.body.error.should.equal('user is owner of group');
            done();
          });
      });
    });

    after((done) => {
      galleryDB.findOne({ name: groupname }, (doc) => {
        galleryDB.removeOne({ name: groupname, uid: doc.uid }, () => { done(); });
      });
    });
  });

  describe('/group/user/join', () => {
    before((done) => {
      agent
        .post('/group/create')
        .send({ groupname })
        .end((_err, _res) => {
          galleryDB.findOne({ name: groupname }, (doc) => {
            agent
              .post('/group/user/invite')
              .send({ gid: doc._id, username: username2 })
              .end((_err2, _res2) => {
                agent
                  .post('/group/create')
                  .send({ groupname: 'the real group' })
                  .end((_err3, _res3) => { done(); });
              });
          });
        });
    });

    it('should not be join non-existent group', (done) => {
      testAgent
        .post('/group/user/join')
        .send({ groupname, gid: '58b2fb2d39f24c268f190769' })
        .end((err, res) => {
          res.should.have.status(404);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal('group doesn\'t exist');
          done();
        });
    });

    it('should not be able to join without invite', (done) => {
      galleryDB.findOne({ name: groupname }, (doc) => {
        testAgent
          .post('/group/user/join')
          .send({ groupname: 'the real group', gid: doc._id })
          .end((err, res) => {
            res.should.have.status(400);
            res.body.should.be.a('object');
            res.body.should.have.property('error');
            res.body.error.should.equal('user isn\'t invited to group');
            done();
          });
      });
    });

    it('should be able to join group', (done) => {
      galleryDB.findOne({ name: groupname }, (doc) => {
        testAgent
          .post('/group/user/join')
          .send({ groupname, gid: doc._id })
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('message');
            res.body.message.should.equal('user has joined the group');
            done();
          });
      });
    });

    after((done) => {
      galleryDB.findOne({ name: groupname }, (doc) => {
        galleryDB.removeMany({ uid: doc.uid }, () => { done(); });
      });
    });
  });

  describe('/group/user/refuse', () => {
    before((done) => {
      agent
        .post('/group/create')
        .send({ groupname })
        .end((_err, _res) => {
          galleryDB.findOne({ name: groupname }, (doc) => {
            agent
              .post('/group/user/invite')
              .send({ gid: doc._id, username: username2 })
              .end((_err2, _res2) => {
                agent
                  .post('/group/create')
                  .send({ groupname: 'the real group' })
                  .end((_err3, _res3) => { done(); });
              });
          });
        });
    });

    it('should not be able to refuse without invite', (done) => {
      galleryDB.findOne({ name: 'the real group' }, (doc) => {
        testAgent
          .post('/group/user/refuse')
          .send({ groupname: 'the real group', gid: doc._id })
          .end((err, res) => {
            res.should.have.status(404);
            res.body.should.be.a('object');
            res.body.should.have.property('error');
            res.body.error.should.equal('invitation doesn\'t exist');
            done();
          });
      });
    });

    it('should be able to refuse', (done) => {
      galleryDB.findOne({ name: groupname }, (doc) => {
        testAgent
          .post('/group/user/refuse')
          .send({ groupname, gid: doc._id })
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('message');
            res.body.message.should.equal('user has refused invitation');
            done();
          });
      });
    });

    after((done) => {
      galleryDB.findOne({ name: groupname }, (doc) => {
        galleryDB.removeMany({ uid: doc.uid }, () => { done(); });
      });
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
