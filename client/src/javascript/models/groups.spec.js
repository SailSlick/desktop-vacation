import { use, should as chaiShould } from 'chai';
import Nock from 'nock';
import chaiThings from 'chai-things';
import Groups from './groups';
import Galleries from './galleries';
import Host from './host';

// Use 'should' style chai testing
const should = chaiShould();
use(chaiThings);

describe('Group model', () => {
  const headers = {
    'set-cookie': ['connect.sid=s%3AoSOmSsKxRUsMYJV-HdXv-05NeXU7BVEe.n%2FHVO%2FKhZfaecG7DUx2afovn%2FW2MMdsV9q33AgaHqP8; Path=/; HttpOnly']
  };
  const testGroupName = 'Foiling';
  const testGalleryName = 'Life';
  const domain = Host.server_uri;
  const error = 'Why on earth would you want to share Land Rover pics';
  let testGallery;

  beforeEach(() => {
    Galleries.should_save = false;
  });

  before((done) => {
    Galleries.add(testGalleryName, (insertedGallery) => {
      insertedGallery.should.be.ok;
      testGallery = insertedGallery;
      done();
    });
  });


  after((done) => {
    Galleries.should_save = true;
    Galleries.getName(testGroupName, (group) => {
      Galleries.remove(group.$loki, _ => done());
    });
  });

  it('can\'t create a group with an invalid name', (done) => {
    Groups.create('', (err, msg) => {
      err.should.be.ok;
      msg.should.be.ok;
      done();
    });
  });

  it('can handle a bad request for gallery creation', (done) => {
    Nock(domain)
      .post('/group/create')
      .reply(500, { status: 500, error: 'too busy watching a flying pig' }, headers);
    Groups.create(testGroupName, (err, msg) => {
      err.should.be.ok;
      msg.should.be.ok;
      Galleries.getName(testGroupName, (group) => {
        should.not.exist(group);
        done();
      });
    });
  });

  it('can create a group', (done) => {
    Nock(domain)
      .post('/group/create')
      .reply(200, { status: 200, message: 'group created' }, headers);
    Groups.create(testGroupName, (err, msg) => {
      should.not.exist(err);
      msg.should.be.ok;
      Galleries.getName(testGroupName, (group) => {
        group.should.be.ok;
        done();
      });
    });
  });

  it('can\'t convert a gallery to a group for an invalid gallery', (done) => {
    Groups.convert('spaghettiBushes', 1000, (err, msg) => {
      err.should.be.ok;
      msg.should.be.ok;
      done();
    });
  });

  it('can handle a bad request for gallery conversion', (done) => {
    Nock(domain)
      .post('/group/convert')
      .reply(401, { status: 401, error }, headers);
    Groups.convert(testGalleryName, testGallery.$loki, (err, msg) => {
      err.should.be.ok;
      msg.should.be.ok;
      Galleries.get(testGallery.$loki, (foundGallery) => {
        foundGallery.group.should.not.be.ok;
        done();
      });
    });
  });

  it('can convert a gallery to a group', (done) => {
    Nock(domain)
      .post('/group/convert')
      .reply(200, { status: 200, message: 'live long and lazy' }, headers);
    Groups.convert(testGalleryName, testGallery.$loki, (err, msg) => {
      should.not.exist(err);
      msg.should.be.ok;
      Galleries.get(testGallery.$loki, (foundGallery) => {
        foundGallery.group.should.be.ok;
        done();
      });
    });
  });

  it('can handle a bad request for getting a group', (done) => {
    Nock(domain)
      .get('/group/')
      .reply(403, { status: 403, error }, headers);
    Groups.get(null, (err, msg, data) => {
      err.should.be.ok;
      msg.should.be.ok;
      should.not.exist(data);
      done();
    });
  });

  it('can get all a users groups', (done) => {
    Nock(domain)
      .get('/group/')
      .reply(200, { status: 200, message: 'if you want to go far, book a flight', data: {} }, headers);
    Groups.get(null, (err, msg, data) => {
      should.not.exist(err);
      msg.should.be.ok;
      data.should.be.ok;
      done();
    });
  });

  it('can get a specific group', (done) => {
    Nock(domain)
      .get(`/group/${testGallery.$loki}`)
      .reply(200, { status: 200, message: 'you don\'t get to 1 billion friends without a hoodie', data: {} }, headers);
    Groups.get(testGallery.$loki, (err, msg, data) => {
      should.not.exist(err);
      msg.should.be.ok;
      data.should.be.ok;
      done();
    });
  });

  it('can handle a bad request from invite a user', (done) => {
    Nock(domain)
      .post('/group/user/invite')
      .reply(400, { status: 400, error }, headers);
    Groups.inviteUser('fakeRemoteId', 'Rully', (err, msg) => {
      err.should.be.ok;
      msg.should.be.ok;
      done();
    });
  });

  it('can invite a user', (done) => {
    Nock(domain)
      .post('/group/user/invite')
      .reply(200, { status: 200, message: 'Do you even drop' }, headers);
    Groups.inviteUser('fakeButMeantToBeRealGid', 'theRealSlimSully', (err, msg) => {
      should.not.exist(err);
      msg.should.be.ok;
      done();
    });
  });

  it('can remove a user', (done) => {
    Nock(domain)
      .post('/group/user/remove')
      .reply(200, { status: 200, message: 'Float like a Cork, Sting like the sadness of Dublin' }, headers);
    Groups.removeUser('fakeButMeantToBeRealGid', 'theRealSlimSully', (err, msg) => {
      should.not.exist(err);
      msg.should.be.ok;
      done();
    });
  });

  it('can allow a user to leave a group', (done) => {
    Nock(domain)
      .post('/group/user/remove')
      .reply(200, { status: 200, message: 'I see fields of green and screens of white' }, headers);
    Groups.leaveGroup('fakeButMeantToBeRealGid', testGroupName, (err, msg) => {
      should.not.exist(err);
      msg.should.be.ok;
      done();
    });
  });

  it('can join a group', (done) => {
    Nock(domain)
      .post('/group/user/join')
      .reply(200, { status: 200, message: 'what doesn\'t kill you makes you hurt a lot' }, headers);
    Groups.join('fakeButMeantToBeRealGid', testGroupName, (err, msg) => {
      should.not.exist(err);
      msg.should.be.ok;
      done();
    });
  });

  it('can refuse an invite to a group', (done) => {
    Nock(domain)
      .post('/group/user/refuse')
      .reply(200, { status: 200, message: 'to see or not to see - specsavers' }, headers);
    Groups.refuse('fakeButMeantToBeRealGid', testGroupName, (err, msg) => {
      should.not.exist(err);
      msg.should.be.ok;
      done();
    });
  });

  it('can get all invites for a user', (done) => {
    Nock(domain)
      .get('/group/user/')
      .reply(200, { status: 200, message: 'when you still think of ports as a place where boats dock', data: 'import background' }, headers);
    Groups.getAllInvites((err, msg) => {
      should.not.exist(err);
      msg.should.be.ok;
      done();
    });
  });

  it('can expand a group', (done) => {
    const groups = { subgalleries: [{ remoteId: 'not gonna be found' }], images: [] };
    Groups.expand(groups, {}, (subgalleries, images) => {
      subgalleries.length.should.equal(1);
      images.length.should.equal(0);
      done();
    });
  });

  it('can expand a group with name filter', (done) => {
    const groups = { subgalleries: [{ remoteId: 'not gonna be found', name: 'huh' }], images: [] };
    Groups.expand(groups, { name: 'huh' }, (subgalleries, images) => {
      subgalleries.length.should.equal(1);
      images.length.should.equal(0);
      done();
    });
  });

  it('can expand a group with rating filter', (done) => {
    const groups = { subgalleries: [{ remoteId: 'not gonna be found', name: 'huh', metadata: { tags: [], rating: 3 } }], images: [] };
    Groups.expand(groups, { rating: 3 }, (subgalleries, images) => {
      subgalleries.length.should.equal(1);
      images.length.should.equal(0);
      done();
    });
  });

  it('can update rating metadata for a group', (done) => {
    const metadata = { rating: 4, tags: [] };
    Groups.updateMetadata('fakeRemoteId', testGallery.$loki, metadata, (updatedGallery) => {
      updatedGallery.metadata.rating.should.equal(4);
      done();
    });
  });

  it('can update tag metadata for a group', (done) => {
    const metadata = { rating: testGallery.metadata.rating, tags: ['test'] };
    Groups.updateMetadata('fakeRemoteId', testGallery.$loki, metadata, (updatedGallery) => {
      updatedGallery.metadata.tags.should.include('test');
      done();
    });
  });

  it('can expand a group with tag filter', (done) => {
    const groups = { subgalleries: [{ remoteId: 'not gonna be found', name: 'huh', metadata: { tags: ['test'], rating: 3 } }], images: [] };
    Groups.expand(groups, { tag: 'test' }, (subgalleries, images) => {
      subgalleries.length.should.equal(1);
      images.length.should.equal(0);
      done();
    });
  });

  it('can handle a request err from deleting a group', (done) => {
    Nock(domain)
      .post('/group/delete')
      .reply(401, { status: 401, error }, headers);
    Groups.delete('fakeRemoteId', testGallery.$loki, (err, msg) => {
      err.should.be.ok;
      msg.should.be.ok;
      Galleries.get(testGallery.$loki, (foundGallery) => {
        foundGallery.should.be.ok;
        done();
      });
    });
  });

  it('can delete a group', (done) => {
    Nock(domain)
      .post('/group/delete')
      .reply(200, { status: 200, message: 'The rumors of my demise are not greatly exaggerated' }, headers);
    Groups.delete('fakeRemoteId', testGallery.$loki, (err, msg) => {
      should.not.exist(err);
      msg.should.be.ok;
      Galleries.get(testGallery.$loki, (foundGallery) => {
        should.not.exist(foundGallery);
        done();
      });
    });
  });
});
