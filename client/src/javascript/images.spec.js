import path from 'path';
import { should, assert } from 'chai';
import Images from './images';

// Use 'should' style chai testing
should();

// Arrow functions not used because the context of 'this' gets lost
describe('images', () => {
  const test_image_path = path.join(__dirname, '../build/icons/512x512.png');

  it('can add images', (done) => {
    Images.add(test_image_path);
    Images.getAll((cb) => {
      assert.equal(cb[0].location, test_image_path, 'Image not added');
      done();
    });
  });

  it('can remove images', (done) => {
    Images.remove(test_image_path);
    Images.getAll((cb) => {
      if (cb.length) {
        assert.notEqual(cb[0].location,
          test_image_path,
          'Last image is the test. It hasn\'t been removed');
      }
      done();
    });
  });
});
