import React from 'react';
import { stub } from 'sinon';
import { mount } from 'enzyme';
import { use, should as chaiShould } from 'chai';
import chaiEnzyme from 'chai-enzyme';
import SelectTools from './selectTools.jsx';

use(chaiEnzyme());
chaiShould();

describe('Selection Toolbar Component', () => {
  let addAllStub;
  let selectAllStub;
  let removeAllStub;
  let clearFilterStub;
  let changeFilterStub;
  let test_component;

  before(() => {
    selectAllStub = stub();
    removeAllStub = stub();
    addAllStub = stub();
    clearFilterStub = stub();
    changeFilterStub = stub();
    test_component = mount(<SelectTools
      multiSelect
      addAllToGallery={addAllStub}
      selectAll={selectAllStub}
      removeAll={removeAllStub}
      clearFilter={clearFilterStub}
      changeFilter={changeFilterStub}
    />);
  });

  after(() => {
    test_component.unmount();
  });

  it('can render', (done) => {
    test_component.find('NavItem').should.have.length(5);
    done();
  });

  it('can select and deselect all', (done) => {
    selectAllStub.reset();
    test_component.find('Glyphicon').at(0).simulate('click');
    test_component.find('Glyphicon').at(1).simulate('click');
    selectAllStub.withArgs(true).onFirstCall();
    selectAllStub.withArgs(false).onSecondCall();
    done();
  });

  it('can add all to gallery', (done) => {
    addAllStub.reset();
    test_component.find('Glyphicon').at(2).simulate('click');
    addAllStub.called.should.be.ok;
    done();
  });

  it('can remove selection', (done) => {
    removeAllStub.reset();
    test_component.find('Glyphicon').at(3).simulate('click');
    removeAllStub.called.should.be.ok;
    done();
  });

  it('can change the filter', (done) => {
    changeFilterStub.reset();
    test_component.find('Form').first().simulate('submit');
    changeFilterStub.called.should.be.ok;
    done();
  });

  it('can clear the filter', (done) => {
    clearFilterStub.reset();
    test_component.find('Glyphicon').at(4).simulate('click');
    clearFilterStub.called.should.be.ok;
    done();
  });

  it('can hide when multiSelect is false', (done) => {
    test_component.setProps({ multiSelect: false });
    test_component.find('NavItem').should.have.length(0);
    done();
  });
});
