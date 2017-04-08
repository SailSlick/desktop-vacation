import React from 'react';
import { stub } from 'sinon';
import { mount } from 'enzyme';
import { use, should as chaiShould } from 'chai';
import chaiEnzyme from 'chai-enzyme';
import Profile from './profile.jsx';
import Host from '../models/host.js';

use(chaiEnzyme());
chaiShould();

describe('Profile Component', () => {
  let deleteStub;
  let logoutStub;
  let changePageStub;
  let hostGetStub;
  let hostAuthStub;
  let test_component;

  before((done) => {
    deleteStub = stub(Profile.prototype, 'deleteAccount');
    logoutStub = stub(Profile.prototype, 'logout');
    changePageStub = stub(Profile.prototype, 'changePage');
    hostGetStub = stub(Host, 'get');
    hostAuthStub = stub(Host, 'isAuthed');
    hostGetStub.returns(null);
    hostAuthStub.returns(false);
    done();
  });

  after((done) => {
    test_component.unmount();
    deleteStub.restore();
    logoutStub.restore();
    changePageStub.restore();
    hostGetStub.restore();
    hostAuthStub.restore();
    done();
  });

  it('can mount', (done) => {
    test_component = mount(<Profile />);
    done();
  });

  it('can get render page when not authed', (done) => {
    test_component.should.have.state('username', 'please make an account');
    test_component.should.have.state('page', 0);
    test_component.should.have.state('loggedIn', false);
    test_component.find('h1').first().should.have.text('Hi please make an account');
    test_component.find('Button').first().should.have.text('Login');
    done();
  });

  it('can click login button', (done) => {
    test_component.find('Button').first().simulate('click');
    changePageStub.called.should.be.ok;
    done();
  });

  it('can click create account button', (done) => {
    changePageStub.reset();
    test_component.find('Button').at(1).simulate('click');
    changePageStub.called.should.be.ok;
    done();
  });

  it('can get render page when authed', (done) => {
    hostGetStub.restore();
    hostAuthStub.restore();
    test_component.unmount();
    test_component = mount(<Profile />);
    test_component.should.not.have.state('username', 'please make an account');
    test_component.should.have.state('page', 1);
    test_component.find('h1').first().should.not.have.text('Hi, please make an account');
    test_component.find('Button').first().should.have.text('Logout');
    done();
  });

  it('can click logout button', (done) => {
    logoutStub.reset();
    test_component.find('Button').first().simulate('click');
    logoutStub.called.should.be.ok;
    done();
  });

  it('can click delete account button', (done) => {
    deleteStub.reset();
    test_component.find('Button').at(1).simulate('click');
    deleteStub.called.should.be.ok;
    done();
  });

  it('can click settings button', (done) => {
    changePageStub.reset();
    test_component.find('Button').at(2).simulate('click');
    changePageStub.called.should.be.ok;
    done();
  });

  it('can change page', (done) => {
    hostAuthStub = stub(Host, 'isAuthed');
    changePageStub.restore();
    test_component.unmount();
    test_component = mount(<Profile />);
    test_component.find('Button').at(1).simulate('click');
    hostAuthStub.called.should.be.ok;
    done();
  });
});
