import React from 'react';
import { stub } from 'sinon';
import { mount } from 'enzyme';
import { use, should as chaiShould } from 'chai';
import chaiEnzyme from 'chai-enzyme';
import FilterTools from './filterTools.jsx';

use(chaiEnzyme());
chaiShould();

describe('Filter Tootbar Component', () => {
  let changeFilterStub;
  let test_component;

  before(() => {
    changeFilterStub = stub();
    test_component = mount(<FilterTools
      filterToggle={false}
      changeFilter={changeFilterStub}
    />);
  });

  after(() => {
    test_component.unmount();
  });

  it('should hide tools when filterToggle is false', (done) => {
    test_component.find('.star-hover').should.have.length(0);
    done();
  });

  it('can render', (done) => {
    test_component.setProps({ filterToggle: true });
    test_component.find('.star-hover').should.have.length(5);
    done();
  });

  it('can use handleChange', (done) => {
    test_component.instance().handleChange({ target: { name: 'tagInput', value: 'nice,maymay' } });
    test_component.instance().state.tagInput.should.equal('nice,maymay');
    done();
  });

  it('can input text into a box', (done) => {
    // in this instance we test with the name box, since we've already done tags
    test_component.find('input').at(1).simulate('change', { target: { name: 'name', value: 'gr8.jpg' } });
    test_component.instance().state.name.should.equal('gr8.jpg');
    done();
  });

  it('can handle rating input', (done) => {
    test_component.find('.star-hover').at(4).simulate('click');
    test_component.instance().state.rating.should.equal(5);
    done();
  });

  it('can search using the filter', (done) => {
    changeFilterStub.reset();
    test_component.find('Button').at(0).simulate('click');
    changeFilterStub.called.should.be.ok;
    changeFilterStub.calledWith({
      tags: ['nice', 'maymay'],
      name: 'gr8.jpg',
      rating: 5
    }).should.be.ok;
    done();
  });

  it('can handle clicking the selected rating', (done) => {
    test_component.find('#deselect-star').at(0).simulate('click');
    test_component.instance().state.rating.should.equal(0);
    done();
  });

  it('can clear the search', (done) => {
    changeFilterStub.reset();
    test_component.find('Button').at(1).simulate('click');
    changeFilterStub.called.should.be.ok;
    changeFilterStub.calledWith({
      tags: [],
      name: '',
      rating: 0
    }).should.be.ok;
    done();
  });
});
