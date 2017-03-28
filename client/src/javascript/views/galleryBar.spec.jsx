import React from 'react';
import { mount } from 'enzyme';
import { use, should as chaiShould } from 'chai';
import chaiEnzyme from 'chai-enzyme';
import GalleryBar from './galleryBar.jsx';
import Galleries from '../models/galleries';

use(chaiEnzyme());
chaiShould();

describe('GalleryBar Component', () => {
  let test_gallery;
  let test_component;

  before((done) => {
    const metadata = { rating: 3, tags: ['choco'] };
    Galleries.should_save = false;
    Galleries.add('ChumpChange', (inserted_gallery) => {
      Galleries.updateMetadata(inserted_gallery.$loki, metadata, (updated_gallery) => {
        test_gallery = updated_gallery;
        done();
      });
    });
  });

  // Remove test image and gallery
  after((done) => {
    test_component.unmount();
    Galleries.remove(test_gallery.$loki, () => done());
  });

  it('can mount', (done) => {
    test_component = mount(<GalleryBar
      updateMetadata={_ => true}
      rating={test_gallery.metadata.rating}
      tags={test_gallery.metadata.tags}
      numImages={test_gallery.images.length}
      numSubgalleries={test_gallery.subgalleries.length}
    />);
    done();
  });

  it('can load correct number of stars', (done) => {
    const rating = test_gallery.metadata.rating;
    test_component.find('.glyphicon.glyphicon-star').length.should.equal(rating);
    test_component.find('.glyphicon.glyphicon-star-empty').length.should.equal(5 - rating);
    done();
  });

  it('can load correct values for image and subgallery counts', (done) => {
    test_component.find('h4').first().text().should.equal('Subgalleries: '.concat(test_gallery.subgalleries.length));
    test_component.find('h4').at(1).text().should.equal('Images: '.concat(test_gallery.images.length));
    done();
  });

  it('can update newTag state value', (done) => {
    test_component.find('[name="newTag"]').simulate('change',
      {
        target: {
          name: 'newTag',
          value: 'cohones'
        }
      });
    test_component.should.have.state('newTag', 'cohones');
    done();
  });
});
