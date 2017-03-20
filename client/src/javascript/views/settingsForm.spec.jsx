import React from 'react';
import { stub } from 'sinon';
import { mount } from 'enzyme';
import { use, should as chaiShould } from 'chai';
import chaiEnzyme from 'chai-enzyme';
import SettingsForm from './settingsForm.jsx';

use(chaiEnzyme());
chaiShould();

describe('SettingsForm Component', () => {
  const submitStub = stub(SettingsForm.prototype, 'changeSettings');
  const backStub = stub(SettingsForm.prototype, 'back');
  let test_component;

  before((done) => {
    test_component = mount(<SettingsForm />);
    done();
  });

  // Remove test image and gallery
  after((done) => {
    test_component.unmount();
    submitStub.restore();
    backStub.restore();
    done();
  });

  it('can get timer input', (done) => {
    test_component.find('[name="timer"]').simulate('change',
      {
        target: {
          name: 'timer',
          value: 50
        }
      });
    test_component.should.have.state('timer', 50);
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

  it('can check timer input for non numeric', (done) => {
    test_component.find('[name="timer"]').simulate('change',
      {
        target: {
          name: 'timer',
          value: 'bad timer'
        }
      });
    test_component.find('.form-group.has-error').first().should.have.length(1);
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
