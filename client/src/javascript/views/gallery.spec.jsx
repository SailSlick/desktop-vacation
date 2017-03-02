import path from 'path';
import React from 'react';
import { spy } from 'sinon';
import { mount } from 'enzyme';
import { use, should as chaiShould } from 'chai';
import chaiEnzyme from 'chai-enzyme';
import Gallery from './gallery.jsx';
import Images from '../models/images';
import Galleries from '../models/galleries';

use(chaiEnzyme());
const should = chaiShould();

describe('gallery view', () => {
  const test_gallery_name = 'Land Rovers';
  const test_image_path = path.join(__dirname, '../build/icons/512x512.png');
  const changeSpy = spy();
  let test_gallery;
  let test_image;
  let test_component;

  before(done =>
    // Create test image
    Images.add(test_image_path, (inserted_image) => {
      test_image = inserted_image;

      // Create test gallery
      Galleries.add(test_gallery_name, inserted_gallery =>
        // Add test image to test gallery
        Galleries.addItem(inserted_gallery.$loki, test_image.$loki, (updated_gallery) => {
          test_gallery = updated_gallery;
          test_component = mount(<Gallery
            key={test_gallery.$loki}
            dbId={test_gallery.$loki}
            onClick={changeSpy}
            onRefresh={done}
          />);
        })
      );
    })
  );

  // Remove test image and gallery
  after(() => {
    test_component.unmount();
    Galleries.remove(test_gallery.$loki);
    Images.remove(test_image.$loki);
  });

  it('can display images in gallery', (done) => {
    test_component.state('images').should.not.be.empty;
    test_component.find('Image').should.not.have.length(0);
    done();
  });

  it('can render simplified version', (done) => {
    test_component.find('Image').should.not.have.length(0);
    test_component.setProps({
      simple: true,
      onRefresh: () => {
        test_component.find('Image').should.be.empty;
        done();
      }
    });
  });

  // Really, this test is just to fix the next one
  it('can render normal version again', (done) => {
    test_component.find('Image').should.be.empty;
    test_component.setProps({
      simple: false,
      onRefresh: () => {
        test_component.find('Image').should.not.have.length(0);
        done();
      }
    });
  });

  it('can remove image from gallery', (done) => {
    let calls = 0;
    const update_props = () => {
      test_component.setProps({
        onRefresh: () => {
          test_component.find('Image').should.be.empty;
          calls++;
          // Make sure done is called at the right time
          // I don't know why gallery_updated is fired twice
          if (calls === 2) {
            done();
          }
        }
      });
    };
    document.addEventListener('gallery_updated', update_props, false);
    test_component.find('.img-menu a').at(2).simulate('click');
  });
  // TODO test subgalleries
});
