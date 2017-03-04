import path from 'path';
import React from 'react';
import { spy } from 'sinon';
import { mount } from 'enzyme';
import { use, should as chaiShould } from 'chai';
import chaiEnzyme from 'chai-enzyme';
import GalleryCard from './gallerycard.jsx';
import Images from '../models/images';
import Galleries from '../models/galleries';

use(chaiEnzyme());
chaiShould();

describe('GalleryCard Component', () => {
  const test_gallery_name = 'Land Rovers';
  const test_image_path = path.join(__dirname, '../build/icons/512x512.png');
  const removeSpy = spy();
  const clickSpy = spy();
  let test_gallery;
  let test_image;
  let test_component;

  before(done =>
    // Create test image
    Images.add(test_image_path, (inserted_image) => {
      test_image = inserted_image;

      // Create test gallery
      Galleries.add(test_gallery_name, (inserted_gallery) => {
        inserted_gallery.$loki.should.be.a('number');
        inserted_gallery.images.should.be.an('array');
        inserted_gallery.subgalleries.should.be.an('array');
        test_gallery = inserted_gallery;

        // Add test image to test gallery
        Galleries.addItem(test_gallery.$loki, test_image.$loki, (updated_gallery) => {
          updated_gallery.images.should.contain(test_image.$loki);
          test_gallery = updated_gallery;
          test_component = mount(<GalleryCard
            key={test_gallery.$loki}
            dbId={test_gallery.$loki}
            name={test_gallery_name}
            thumbnail={test_image_path}
            onClick={clickSpy}
            onRemove={removeSpy}
          />);
          done();
        });
      });
    })
  );

  // Remove test image and gallery
  after((done) => {
    Images.remove(test_image.$loki, () => true);
    Galleries.remove(test_gallery.$loki, _ => done());
  });

  it('can render gallery card element', (done) => {
    test_component.find('img').first().should.have.prop('src', test_image_path);
    test_component.find('h2').first().should.have.text(test_gallery.name);
    done();
  });

  it('can fire onClick handler', (done) => {
    clickSpy.called.should.not.be.ok;
    test_component.find('figure').first().simulate('click');
    clickSpy.called.should.be.ok;
    done();
  });

  it('can request remove of element', (done) => {
    removeSpy.called.should.not.be.ok;
    test_component.find('.img-menu a').at(1).simulate('click');
    removeSpy.called.should.be.ok;
    done();
  });

  it('can render simplified gallery card element', (done) => {
    test_component.find('MenuItem').should.not.be.empty;
    test_component.setProps({ simple: true });
    test_component.find('MenuItem').should.be.empty;
    done();
  });
});
