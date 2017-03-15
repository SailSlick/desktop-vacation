import path from 'path';
import React from 'react';
import { spy } from 'sinon';
import { mount } from 'enzyme';
import { use, should as chaiShould } from 'chai';
import { Simulate } from 'react-addons-test-utils';
import chaiEnzyme from 'chai-enzyme';
import Main from './main.jsx';
import Images from '../models/images';
import Galleries from '../models/galleries';

use(chaiEnzyme());
chaiShould();

describe('Main Component', () => {
  const base_gallery_id = 1;
  const test_gallery_name = 'Land Rovers';
  const test_image_path = path.join(__dirname, '../build/icons/512x512.png');
  let test_gallery;
  let test_image;
  let test_component;

  beforeEach(() => {
    Galleries.should_save = false;
  });

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

  it('can render images and galleries', (done) => {
    test_component = mount(<Main />);
    test_component.find('figure h2').someWhere(n => n.text() === test_gallery.name).should.be.ok;
    test_component.find('img').someWhere(n => n.prop('src') === test_image_path).should.be.ok;
    done();
  });

  it('can open gallery name modal', (done) => {
    test_component.should.have.state('newGalleryModal', false);
    test_component.instance().getNewGalleryName();
    test_component.should.have.state('newGalleryModal', true);
    done();
  });

  it('can add new gallery and close modal', (done) => {
    test_component.should.have.state('newGalleryModal', true);

    // Attempt to add a duplicate, so nothing actually happens
    const event = {
      preventDefault: () => true,
      target: {
        galleryname: {
          value: test_gallery_name
        }
      }
    };
    test_component.instance().addNewGallery(event, () => {
      test_component.should.have.state('newGalleryModal', false);
      setTimeout(() => {
        document.body.getElementsByClassName('modal').should.be.empty;
        done();
      }, 750);
    });
  });

  it('can open gallery selector modal', (done) => {
    test_component.should.have.state('selectGalleryModal', false);
    test_component.instance().showGallerySelector({ detail: [test_image.$loki] });
    test_component.should.have.state('selectGalleryModal', true);
    test_component.state().imageSelection.should.contain(test_image.$loki);
    done();
  });

  it('can add selected images to selected gallery', (done) => {
    const addSpy = spy(Galleries, 'addItem');
    test_component.instance().onSelectGallery(test_gallery.$loki);
    test_component.should.have.state('selectGalleryModal', false);
    test_component.should.have.state('imageSelection', null);
    addSpy.called.should.be.ok;
    addSpy.restore();
    done();
  });

  it('can close all modals', (done) => {
    test_component.instance().getNewGalleryName();
    Simulate.click(document.body.getElementsByClassName('modal')[0]);
    test_component.should.have.state('newGalleryModal', false);

    // This wait is to account for the fact it fades out
    setTimeout(() => {
      document.body.getElementsByClassName('modal').should.be.empty;
      done();
    }, 750);
  });

  it('can change gallery', (done) => {
    test_component.should.have.state('galleryId', base_gallery_id);
    test_component.instance().changeGallery(test_gallery.$loki);
    test_component.should.have.state('galleryId', test_gallery.$loki);
    done();
  });

  it('can\'t change to null gallery', (done) => {
    test_component.should.have.state('galleryId', test_gallery.$loki);
    test_component.instance().changeGallery(null);
    test_component.should.have.state('galleryId', test_gallery.$loki);
    done();
  });

  it('can show an alert', (done) => {
    test_component.instance().showAlert({ detail: {
      type: 'info',
      message: 'Land Rovers are the best',
      headline: 'Info'
    } });
    test_component.find('AlertList').props().alerts.should.not.be.empty;
    done();
  });

  it('can dismiss an alert', (done) => {
    const alert = test_component.find('AlertList').props().alerts[0];
    test_component.instance().dismissAlert(alert);
    test_component.find('AlertList').props().alerts.should.not.contain(alert);
    done();
  });

  it('can toggle select modes', (done) => {
    test_component.should.have.state('multiSelect', false);
    test_component.instance().toggleSelectMode();
    test_component.should.have.state('multiSelect', true);
    test_component.instance().toggleSelectMode();
    test_component.should.have.state('multiSelect', false);
    done();
  });

  it('can unmount safely', (done) => {
    test_component.unmount();
    done();
  });
});
