import path from 'path';
import React from 'react';
import { spy, stub } from 'sinon';
import { mount } from 'enzyme';
import { use, should as chaiShould } from 'chai';
import chaiEnzyme from 'chai-enzyme';
import { Simulate } from 'react-addons-test-utils';
import Image from './image.jsx';
import Images from '../models/images';
import Wallpaper from '../helpers/wallpaper-client';
import Sync from '../helpers/sync';

use(chaiEnzyme());
chaiShould();

describe('Image Component', () => {
  const test_image_path = path.join(__dirname, '../build/icons/512x512.png');
  const removeSpy = spy();
  const uploadSpy = spy();
  const fakeUrl = 'psst. im not a real url';
  let test_image;
  let test_component;
  let imageUpdateStub;
  let syncShareStub;
  let syncUnshareStub;

  before((done) => {
    imageUpdateStub = stub(Images, 'update');
    syncShareStub = stub(Sync, 'shareImage').returns(fakeUrl);
    syncUnshareStub = stub(Sync, 'unshareImage');
    Images.add(test_image_path, (inserted_image) => {
      test_image = inserted_image;
      test_component = mount(<Image
        key={test_image.$loki}
        dbId={test_image.$loki}
        remoteId={'thisisatestyo'}
        rating={test_image.metadata.rating}
        tags={test_image.metadata.tags}
        src={test_image_path}
        onRemove={removeSpy}
        onUpload={uploadSpy}
      />);
      done();
    });
  });

  after(() => {
    Images.remove(test_image.$loki, () => true);
    imageUpdateStub.restore();
    syncShareStub.restore();
    syncUnshareStub.restore();
  });

  it('can add a tag', (done) => {
    imageUpdateStub.reset();
    test_component.instance().updateMetadata('hula', false);
    imageUpdateStub.called.should.be.ok;
    done();
  });

  it('can remove a tag', (done) => {
    imageUpdateStub.reset();
    test_component.instance().updateMetadata('hula', true);
    imageUpdateStub.called.should.be.ok;
    done();
  });

  it('can update the rating', (done) => {
    imageUpdateStub.reset();
    test_component.instance().updateMetadata(3, false);
    imageUpdateStub.called.should.be.ok;
    done();
  });

  it('can render image element', (done) => {
    test_component.find('img').first().should.have.prop('src', test_image_path);
    done();
  });

  it('can open expand modal', (done) => {
    test_component.should.have.state('expanded', false);
    test_component.find('Image').simulate('click');
    test_component.should.have.state('expanded', true);
    done();
  });

  it('can render star rating', (done) => {
    test_component.should.have.state('expanded', true);
    test_component.find('a').at(3).should.exist;
    done();
  });

  it('can close expand modal', (done) => {
    test_component.should.have.state('expanded', true);
    Simulate.click(document.body.getElementsByClassName('modal')[0]);
    test_component.should.have.state('expanded', false);

    // This wait is to account for the fact it fades out
    setTimeout(() => {
      document.body.getElementsByClassName('modal').should.be.empty;
      done();
    }, 750);
  });

  it('can open delete confirmation modal', (done) => {
    test_component.should.have.state('deleteConfirmation', false);
    test_component.find('.img-menu a').at(5).simulate('click');
    test_component.should.have.state('deleteConfirmation', true);
    done();
  });

  it('can confirm deletion', (done) => {
    removeSpy.reset();
    test_component.should.have.state('deleteConfirmation', true);
    test_component.instance().confirmDelete();
    test_component.should.have.state('deleteConfirmation', false);
    removeSpy.called.should.be.ok;
    done();
  });

  it('can set itself as the wallpaper', (done) => {
    const wallpaperStub = stub(Wallpaper, 'set');
    test_component.find('.img-menu a').at(0).simulate('click');
    wallpaperStub.called.should.be.ok;
    done();
  });

  it('can request add to gallery modal', (done) => {
    const test_cb = () => {
      document.removeEventListener('append_gallery', test_cb);
      done();
    };
    document.addEventListener('append_gallery', test_cb, false);

    test_component.find('.img-menu a').at(1).simulate('click');
  });

  it('can request remove of element', (done) => {
    removeSpy.reset();
    removeSpy.called.should.not.be.ok;
    test_component.find('.img-menu a').at(4).simulate('click');
    removeSpy.called.should.be.ok;
    done();
  });

  it('can request upload of element', (done) => {
    uploadSpy.reset();
    uploadSpy.called.should.not.be.ok;
    test_component.find('.img-menu a').at(2).simulate('click');
    uploadSpy.called.should.be.ok;
    done();
  });

  it('can request share an image', (done) => {
    syncShareStub.reset();
    test_component.find('.img-menu a').at(3).simulate('click');
    syncShareStub.called.should.be.ok;
    done();
  });

  it('can request unshare an image', (done) => {
    syncUnshareStub.reset();
    /*
     * NOTE can't use .at(4) because the button is only rendered if url is set
     * I cant figure out a way to update state and force rerender.
     * I tried test_component.setState and test_component.update()
     */
    test_component.instance().unshare();
    syncUnshareStub.called.should.be.ok;
    done();
  });
});
