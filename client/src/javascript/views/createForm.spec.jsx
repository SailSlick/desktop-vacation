import React from 'react';
import { stub } from 'sinon';
import { mount } from 'enzyme';
import { use, should as chaiShould } from 'chai';
import chaiEnzyme from 'chai-enzyme';
import CreateForm from './createForm.jsx';
import Host from '../models/host.js';

use(chaiEnzyme());
chaiShould();

describe('CreateForm Component', () => {
  let submitStub;
  let backStub;
  let hostCreateStub;
  let test_component;

  before((done) => {
    submitStub = stub(CreateForm.prototype, 'createAccount');
    backStub = stub(CreateForm.prototype, 'back');
    hostCreateStub = stub(Host, 'createAccount');
    done();
  });

  after((done) => {
    test_component.unmount();
    submitStub.restore();
    backStub.restore();
    hostCreateStub.restore();
    done();
  });

  it('can mount', (done) => {
    test_component = mount(<CreateForm />);
    done();
  });

  it('can get username input', (done) => {
    test_component.find('[name="username"]').simulate('change',
      {
        target: {
          name: 'username',
          value: 'greatusername'
        }
      });
    test_component.should.have.state('username', 'greatusername');
    done();
  });

  it('can get password input', (done) => {
    test_component.find('[name="password"]').simulate('change',
      {
        target: {
          name: 'password',
          value: 'greatpassword'
        }
      });
    test_component.should.have.state('password', 'greatpassword');
    done();
  });

  it('can get password2 input', (done) => {
    test_component.find('[name="password2"]').simulate('change',
      {
        target: {
          name: 'password2',
          value: 'greatpassword'
        }
      });
    test_component.should.have.state('password2', 'greatpassword');
    done();
  });

  it('can check username input for spaces', (done) => {
    test_component.find('[name="username"]').simulate('change',
      {
        target: {
          name: 'username',
          value: 'bad username'
        }
      });
    test_component.find('.form-group.has-error').should.have.length(1);
    done();
  });

  it('can check password input for length', (done) => {
    test_component.find('[name="password"]').simulate('change',
      {
        target: {
          name: 'password',
          value: 'bpw'
        }
      });
    test_component.find('.form-group.has-warning').should.have.length(1);
    done();
  });

  it('can check password2 input for diff to password1', (done) => {
    test_component.find('.form-group.has-error').should.exist;
    done();
  });

  it('can submit form', (done) => {
    test_component.find('Form').first().simulate('submit');
    submitStub.called.should.be.ok;
    done();
  });

  it('can call Host model correctly for create account', (done) => {
    submitStub.restore();
    // remount so form can be submitted again
    test_component.unmount();
    test_component = mount(<CreateForm />);
    test_component.find('Form').first().simulate('submit',
      {
        preventDefault: () => true,
        target: {
          username: { value: 'sully' },
          password: { value: 'greatpw' },
          password2: { value: 'greatpw' }
        }
      });
    hostCreateStub.called.should.be.ok;
    done();
  });

  it('can click back button', (done) => {
    test_component.find('Button').first().simulate('click');
    backStub.called.should.be.ok;
    done();
  });
});
