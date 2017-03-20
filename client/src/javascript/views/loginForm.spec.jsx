import React from 'react';
import { stub } from 'sinon';
import { mount } from 'enzyme';
import { use, should as chaiShould } from 'chai';
import chaiEnzyme from 'chai-enzyme';
import LoginForm from './loginForm.jsx';

use(chaiEnzyme());
chaiShould();

describe('LoginForm Component', () => {
  const submitStub = stub(LoginForm.prototype, 'login');
  const backStub = stub(LoginForm.prototype, 'back');
  let test_component;

  before((done) => {
    test_component = mount(<LoginForm />);
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
    test_component.find('.form-group.has-error').should.have.length(1);
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
