import path from 'path';
import { spy } from 'sinon';
import { ipcRenderer as ipc } from 'electron';
import { should as chaiShould } from 'chai';
import Slideshow from './slideshow-client';
import Images from '../models/images';
import Galleries from '../models/galleries';

// Use 'should' style chai testing
chaiShould();

describe('Slideshow Helper (Client)', () => {
  const test_gallery_name = 'Land Rovers';
  const test_image_path = path.join(__dirname, '../build/icons/512x512.png');
  let ipcSpy;
  let test_image;
  let test_gallery;

  beforeEach(() => {
    Galleries.should_save = false;
  });

  before(done =>
    // Create test image
    Images.add(test_image_path, (inserted_image) => {
      test_image = inserted_image;

      // Create test gallery
      Galleries.add(test_gallery_name, inserted_gallery =>
        // Add test image to test gallery
        Galleries.addItem(inserted_gallery.$loki, test_image.$loki, (updated_gallery) => {
          test_gallery = updated_gallery;
          ipcSpy = spy(ipc, 'send');
          done();
        })
      );
    })
  );

  // Remove test image and gallery
  after((done) => {
    ipc.send.restore();
    Images.remove(test_image.$loki, () => true);
    Galleries.remove(test_gallery.$loki, () => done());
  });

  it('can set the slideshow', (done) => {
    Slideshow.set(test_gallery.$loki, () => {
      ipcSpy.calledOnce.should.be.ok;
      ipcSpy.args[0][0].should.be.equal('set-slideshow');
      ipcSpy.args[0][1].should.be.deep.equal([test_image_path]);
      done();
    });
  });

  it('can clear the slideshow', (done) => {
    ipcSpy.reset();
    Slideshow.clear(() => {
      ipcSpy.calledOnce.should.be.ok;
      ipcSpy.calledWith('clear-slideshow');
      done();
    });
  });
});

