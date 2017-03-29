import React from 'react';
import { mount } from 'enzyme';
import { use, should as chaiShould } from 'chai';
import chaiEnzyme from 'chai-enzyme';
import InfiniteScrollInfo from './infiniteScrollInfo.jsx';

use(chaiEnzyme());
chaiShould();

describe('Infinite Scroll Info Component', () => {
  let test_component;

  before(() => {
    test_component = mount(<InfiniteScrollInfo
      itemsLimit={5}
      itemsTotal={10}
    />);
  });

  after(() => {
    test_component.unmount();
  });

  it('shows correct text when not at bottom', (done) => {
    test_component.find('h4').should.have.text('Scroll to load more');
    done();
  });

  it('shows correct text when at bottom', (done) => {
    test_component.setProps({ itemsLimit: 10 });
    test_component.find('h4').should.have.text('End of gallery');
    done();
  });
});
