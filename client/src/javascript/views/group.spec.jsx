import React from 'react';
import Nock from 'nock';
import { spy, stub } from 'sinon';
import { mount } from 'enzyme';
import { use, should as chaiShould } from 'chai';
import chaiEnzyme from 'chai-enzyme';
import Group from './group.jsx';
import Galleries from '../models/galleries';
import Groups from '../models/groups';
import Host from '../models/host';

use(chaiEnzyme());
const should = chaiShould();

describe('Group Component', () => {
  const headers = {
    'set-cookie': ['connect.sid=s%3AoSOmSsKxRUsMYJV-HdXv-05NeXU7BVEe.n%2FHVO%2FKhZfaecG7DUx2afovn%2FW2MMdsV9q33AgaHqP8; Path=/; HttpOnly']
  };
  const testGroupName = 'Foiling';
  const domain = Host.server_uri;
  const changeSpy = spy();
  let testGroup;
  let testComponent;
  let isAuthedStub;
  let groupUpdateMetadataStub;

  beforeEach(() => {
    Galleries.should_save = false;
  });

  before((done) => {
    groupUpdateMetadataStub = stub(Groups, 'updateMetadata');
    isAuthedStub = stub(Host, 'isAuthed').returns(true);
    Nock(domain)
      .post('/group/create')
      .reply(200, { status: 200, message: 'group created', data: 'fakeRemoteId' }, headers);
    Groups.create(testGroupName, (err, msg) => {
      should.not.exist(err);
      msg.should.be.ok;
      Galleries.getName(testGroupName, (group) => {
        group.should.be.ok;
        testGroup = group;
        done();
      });
    });
  });

  // Remove test image and gallery
  after((done) => {
    groupUpdateMetadataStub.restore();
    isAuthedStub.restore();
    testComponent.unmount();
    Galleries.should_save = true;
    Galleries.remove(testGroup.$loki, () => done());
    Galleries.should_save = false;
  });

  it('can mount the base group', (done) => {
    testGroup.remoteId = 'fakeMongoId';
    Nock(domain)
      .get('/group/')
      .reply(200, {
        status: 200,
        message: 'test',
        data: {
          subgalleries: [testGroup],
          images: []
        }
      }, headers);
    testComponent = mount(<Group
      dbId={'1'}
      onChange={changeSpy}
    />);
    isAuthedStub.called.should.be.ok;
    done();
  });

  it('can add a tag', (done) => {
    groupUpdateMetadataStub.reset();
    testComponent.instance().updateMetadata('hula', false);
    groupUpdateMetadataStub.called.should.be.ok;
    done();
  });

  it('can remove a tag', (done) => {
    groupUpdateMetadataStub.reset();
    testComponent.instance().updateMetadata('hula', true);
    groupUpdateMetadataStub.called.should.be.ok;
    done();
  });

  it('can update the rating', (done) => {
    groupUpdateMetadataStub.reset();
    testComponent.instance().updateMetadata(3, false);
    groupUpdateMetadataStub.called.should.be.ok;
    done();
  });

  it('can refresh the view', (done) => {
    isAuthedStub.reset();
    Nock(domain)
      .get('/group/fakeRemoteId')
      .reply(200, {
        status: 200,
        message: 'test',
        data: testGroup
      }, headers);
    testComponent.find('h2').simulate('click');
    changeSpy.called.should.be.ok;
    done();
  });

  it('can unmount', (done) => {
    testComponent.unmount();
    done();
  });
});
