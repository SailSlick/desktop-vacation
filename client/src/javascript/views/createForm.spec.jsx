import React from 'react';
import { stub } from 'sinon';
import { mount } from 'enzyme';
import { use, should as chaiShould } from 'chai';
import chaiEnzyme from 'chai-enzyme';
import CreateForm from './createForm.jsx';

use(chaiEnzyme());
chaiShould();

describe('CreateForm Component', () => {
  const submitStub = stub(CreateForm.prototype, 'createAccount');
  const backStub = stub(CreateForm.prototype, 'back');
  let test_component;

  before((done) => {
    test_component = mount(<CreateForm />);
    done();
  });

  // Remove test image and gallery
  after((done) => {
    test_component.unmount();
    submitStub.restore();
    backStub.restore();
    done();
  });

  it('can get username input', (done) => {
    const usernameInput = test_component.find('[name="username"]');
    usernameInput.value = 'greatusername';
    usernameInput.simulate('change',
      {
        target: {
          name: 'username',
          value: usernameInput.value
        }
      });
    test_component.should.have.state('username', 'greatusername');
    done();
  });

  it('can get password input', (done) => {
    const passwordInput = test_component.find('[name="password"]');
    passwordInput.value = 'greatpassword';
    passwordInput.simulate('change',
      {
        target: {
          name: 'password',
          value: passwordInput.value
        }
      });
    test_component.should.have.state('password', 'greatpassword');
    done();
  });

  it('can get password2 input', (done) => {
    const passwordInput = test_component.find('[name="password2"]');
    passwordInput.value = 'greatpassword';
    passwordInput.simulate('change',
      {
        target: {
          name: 'password2',
          value: passwordInput.value
        }
      });
    test_component.should.have.state('password2', 'greatpassword');
    done();
  });

  it('can check username input for spaces', (done) => {
    const usernameInput = test_component.find('[name="username"]');
    usernameInput.value = 'bad username';
    usernameInput.simulate('change',
      {
        target: {
          name: 'username',
          value: usernameInput.value
        }
      });
    test_component.find('.form-group.has-error').first().should.have.length(1);
    done();
  });

  it('can check password input for length', (done) => {
    const passwordInput = test_component.find('[name="password"]');
    passwordInput.value = 'bpw';
    passwordInput.simulate('change',
      {
        target: {
          name: 'password',
          value: passwordInput.value
        }
      });
    test_component.find('.form-group.has-warning').should.have.length(1);
    done();
  });

  it('can check password2 input for diff to password1', (done) => {
    test_component.find('.form-group.has-error').at(1).should.have.length(1);
    done();
  });

  it('can submit form', (done) => {
    test_component.find('Form').first().simulate('submit');
    submitStub.called.should.be.ok;
    done();
  });

  it('can click back button', (done) => {
    test_component.find('Button').first().simulate('click');
    backStub.called.should.be.ok;
    done();
  });
});
