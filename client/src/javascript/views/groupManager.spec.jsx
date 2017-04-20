import React from 'react';
import Nock from 'nock';
import { spy, stub } from 'sinon';
import { mount } from 'enzyme';
import { use, should as chaiShould } from 'chai';
import chaiEnzyme from 'chai-enzyme';
import GroupManager from './groupManager.jsx';
import Galleries from '../models/galleries';
import Groups from '../models/groups';
import Host from '../models/host';

use(chaiEnzyme());
const should = chaiShould();

describe('groupManager Component', () => {
  const headers = {
    'set-cookie': ['connect.sid=s%3AoSOmSsKxRUsMYJV-HdXv-05NeXU7BVEe.n%2FHVO%2FKhZfaecG7DUx2afovn%2FW2MMdsV9q33AgaHqP8; Path=/; HttpOnly']
  };
  const testGroupName = 'Foiling2';
  const domain = Host.server_uri;
  const removeSpy = spy();
  const hostUid = Host.uid;
  let testGroup;
  let testComponent;
  let groupDeleteStub;
  let groupLeaveStub;
  let groupRemoveUserStub;
  let groupInviteStub;

  beforeEach(() => {
    Galleries.should_save = false;
  });

  before((done) => {
    Host.uid = 'yahboy';
    groupDeleteStub = stub(Groups, 'delete').returns(true);
    groupLeaveStub = stub(Groups, 'leaveGroup').returns(true);
    groupRemoveUserStub = stub(Groups, 'removeUser').returns(true);
    groupInviteStub = stub(Groups, 'inviteUser').returns(true);
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
    Host.uid = hostUid;
    groupDeleteStub.restore();
    groupLeaveStub.restore();
    groupInviteStub.restore();
    testComponent.unmount();
    Galleries.remove(testGroup.$loki, done);
  });

  it('can mount', (done) => {
    testComponent = mount(<GroupManager
      dbId={testGroup.$loki}
      remoteId={testGroup.RemoteId}
      uid={'nahboy'}
      users={['Sully', 'Rully']}
      onRemove={removeSpy}
    />);
    done();
  });

  it('can render user list', (done) => {
    testComponent.find('td').at(1).text().should.equal('Sully');
    testComponent.find('td').at(3).text().should.equal('Rully');
    done();
  });

  it('can see correct things when normal user', (done) => {
    testComponent.find('Button').at(2).text().should.equal('Leave Group');
    done();
  });

  it('can click leave group as a normal user', (done) => {
    groupLeaveStub.reset();
    testComponent.find('Button').at(2).simulate('click');
    groupLeaveStub.called.should.be.ok;
    done();
  });

  it('can see correct things when owner', (done) => {
    Host.uid = 'nahboy';
    testComponent.unmount();
    testComponent = mount(<GroupManager
      dbId={testGroup.$loki}
      remoteId={testGroup.RemoteId}
      uid={'nahboy'}
      users={['Sully', 'Rully']}
      onRemove={removeSpy}
    />);
    testComponent.find('Form').should.exist;
    done();
  });

  it('can change the input for the username', (done) => {
    testComponent.find('[name="username"]').simulate('change',
      {
        target: {
          name: 'username',
          value: 'bad pw'
        }
      });
    testComponent.should.have.state('username', 'bad pw');
    done();
  });

  it('can check validationState for username', (done) => {
    testComponent.find('[name="username"]').simulate('change',
      {
        target: {
          name: 'username',
          value: 'greatusername'
        }
      });
    testComponent.find('.form-group.has-success').should.have.length(1);
    done();
  });

  it('can call invite user', (done) => {
    testComponent.find('Form').first().simulate('submit',
      {
        preventDefault: () => true,
        target: {
          username: { value: 'sully' },
          password: { value: 'greatpw' }
        }
      });
    groupInviteStub.called.should.be.ok;
    done();
  });

  it('can call removeUser', (done) => {
    groupRemoveUserStub.reset();
    testComponent.find('Button').at(0).simulate('click');
    groupRemoveUserStub.called.should.be.ok;
    done();
  });

  it('can call delete group', (done) => {
    groupDeleteStub.reset();
    testComponent.find('Button').at(3).simulate('click');
    groupDeleteStub.called.should.be.ok;
    done();
  });

  it('can unmount', (done) => {
    testComponent.unmount();
    done();
  });
});
