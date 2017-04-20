import React from 'react';
import { mount } from 'enzyme';
import { use, should as chaiShould } from 'chai';
import chaiEnzyme from 'chai-enzyme';
import LoadingBar from './loadingBar.jsx';

use(chaiEnzyme());
chaiShould();

describe('Loading Bar', () => {
  const testSize = 100;
  const testMessage = 'for the murder tree is fickle, and lies';
  let test_component;

  before((done) => {
    test_component = mount(<LoadingBar />);
    done();
  });

  it('should ignore an end progress when no progress has been made', (done) => {
    test_component.instance().endProgress();
    test_component.should.have.state('progress', 0);
    done();
  });

  it('can update progress', (done) => {
    test_component.instance().updateProgress({ detail: { size: testSize, message: testMessage } });
    test_component.should.have.state('progress', testSize / 100);
    test_component.should.have.state('message', testMessage);
    done();
  });

  it('can update progress twice properly', (done) => {
    test_component.instance().updateProgress({ detail: { size: testSize, message: testMessage } });
    test_component.should.have.state('progress', (testSize / 100) * 2);
    test_component.should.have.state('message', testMessage);
    done();
  });

  it('can end progress properly', (done) => {
    test_component.instance().endProgress();
    test_component.should.have.state('progress', 100);
    test_component.should.have.state('opacity', 0);
    done();
  });

  it('can reset progress', (done) => {
    test_component.instance().resetProgress();
    test_component.should.have.state('progress', 0);
    test_component.should.have.state('opacity', 1);
    test_component.should.have.state('message', '');
    done();
  });
});
