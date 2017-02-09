import path from 'path';
import { should } from 'chai';
import Images from './images';

// Use "should" style chai testing
should();

// Arrow functions not used because the context of "this" gets lost
describe('images', () => {
  const test_image_path = path.join(__dirname, '../build/icons/512x512.png');

  it('can add images', () => {
    Images.add(test_image_path);
    return Images.getAll().should.have.members([test_image_path]);
  });

  it('can remove images', () => {
    Images.remove(test_image_path);
    return Images.getAll().should.not.have.members([test_image_path]);
  });
});
