import { use, should as chaiShould } from 'chai';
import Nock from 'nock';
import chaiThings from 'chai-things';
import Host from './host';

// Use 'should' style chai testing
const should = chaiShould();
use(chaiThings);

describe('Host model', () => {
  let username;
  const username2 = 'Rully';
  const password = 'password';
  const password2 = 'wrongpw';
  const domain = Host.server_uri;
  const message = 'mock message';
  const error = 'mock error';
  const uid = 'sj478b97bac0595474108b48';
  const headers = {
    'set-cookie': ['connect.sid=s%3AoSOmSsKxRUsMYJV-HdXv-05NeXU7BVEe.n%2FHVO%2FKhZfaecG7DUx2afovn%2FW2MMdsV9q33AgaHqP8; Path=/; HttpOnly']
  };

  // Recreate account
  after((done) => {
    Nock(domain)
      .post('/user/create')
      .reply(200, { status: 200, message, uid, domain }, headers);
    Host.createAccount(username, password, () => done());
  });

  it('can get Host by index', (done) => {
    Host.getIndex(1, (doc) => {
      should.exist(doc);
      username = doc.username;
      done();
    });
  });

  it('can get Host by username', (done) => {
    Host.get(username, (doc) => {
      should.exist(doc);
      done();
    });
  });

  it('can update Host', (done) => {
    const query = { username };
    const data = { test: 'test value' };
    Host.update(query, data, (doc) => {
      should.exist(doc);
      done();
    });
  });

  it('can remove a user by username', (done) => {
    Host.remove(username);
    Host.get(username, (doc) => {
      should.not.exist(doc);
      done();
    });
  });

  it('can clear the host db', (done) => {
    Host.clear(() => {
      Host.get(username, (doc) => {
        should.not.exist(doc);
        done();
      });
    });
  });

  it('can create an account', (done) => {
    Nock(domain)
      .post('/user/create')
      .reply(200, { status: 200, message, uid, domain }, headers);
    Host.createAccount(username, password, (status, msg) => {
      should.not.exist(status);
      msg.should.be.a('string');
      done();
    });
  });

  it('can set uid after creating an account', (done) => {
    Host.uid.should.be.a('string');
    Host.uid.should.have.lengthOf(24);
    done();
  });

  it('can check if authed after create account', (done) => {
    Host.isAuthed().should.be.true;
    done();
  });

  it('can\'t create account on top of another account', (done) => {
    Host.createAccount(username2, password, (status, msg) => {
      status.should.be.a('number');
      status.should.equal(500);
      msg.should.be.a('string');
      done();
    });
  });

  it('can logout', (done) => {
    Nock(domain)
      .post('/user/logout')
      .reply(200, { status: 200, message, domain }, headers);
    Host.logout((status, msg) => {
      should.not.exist(status);
      msg.should.be.a('string');
      done();
    });
  });

  it('can check if still authed after logout', (done) => {
    Host.isAuthed().should.be.false;
    done();
  });

  it('can set uid after logout', (done) => {
    Host.uid.should.be.a('string');
    Host.uid.should.have.lengthOf(0);
    done();
  });

  it('can\'t logout without being logged in', (done) => {
    Nock(domain)
      .post('/user/logout')
      .reply(401, { status: 401, error, domain }, headers);
    Host.logout((status, msg) => {
      status.should.be.a('number');
      status.should.equal(401);
      msg.should.be.a('string');
      done();
    });
  });

  it('can\'t update password without being logged in', (done) => {
    Nock(domain)
      .post('/user/update')
      .reply(401, { status: 401, error, domain }, headers);
    Host.updateAccount(password2, (status, msg) => {
      status.should.be.a('number');
      status.should.equal(401);
      msg.should.be.a('string');
      done();
    });
  });

  it('can\'t delete account without being logged in', (done) => {
    Nock(domain)
      .post('/user/delete')
      .reply(401, { status: 401, error, domain }, headers);
    Host.deleteAccount((status, msg) => {
      status.should.be.a('number');
      status.should.equal(401);
      msg.should.be.a('string');
      Host.get(username, (doc) => {
        should.exist(doc);
        done();
      });
    });
  });

  it('can\'t login to an account not on device', (done) => {
    Host.login(username2, password, (status, msg) => {
      status.should.be.a('number');
      status.should.equal(500);
      msg.should.be.a('string');
      done();
    });
  });

  it('can\'t login with wrong password', (done) => {
    Nock(domain)
      .post('/user/login')
      .reply(401, { status: 401, error, domain }, headers);
    Host.login(username, password2, (status, msg) => {
      status.should.be.a('number');
      status.should.equal(401);
      msg.should.be.a('string');
      done();
    });
  });

  it('can login', (done) => {
    Nock(domain)
      .post('/user/login')
      .reply(200, { status: 200, message, uid, domain }, headers);
    Host.login(username, password, (status, msg) => {
      should.not.exist(status);
      msg.should.be.a('string');
      done();
    });
  });

  it('can set uid after login', (done) => {
    Host.uid.should.be.a('string');
    Host.uid.should.have.lengthOf(24);
    done();
  });

  it('can check if authed after login', (done) => {
    Host.isAuthed().should.be.true;
    done();
  });

  it('can update password', (done) => {
    Nock(domain)
      .post('/user/update')
      .reply(200, { status: 200, message, domain }, headers);
    Host.updateAccount(password2, (status, msg) => {
      should.not.exist(status);
      msg.should.be.a('string');
      done();
    });
  });

  it('can delete account', (done) => {
    Nock(domain)
      .post('/user/delete')
      .reply(200, { status: 200, message, uid, domain }, headers);
    Host.deleteAccount((status, msg) => {
      should.not.exist(status);
      msg.should.be.a('string');
      Host.get(username, (doc) => {
        should.not.exist(doc);
        done();
      });
    });
  });

  it('can set uid after delete account', (done) => {
    Host.uid.should.be.a('string');
    Host.uid.should.have.lengthOf(0);
    done();
  });

  it('can check if still authed after delete account', (done) => {
    Host.isAuthed().should.be.false;
    done();
  });
});
