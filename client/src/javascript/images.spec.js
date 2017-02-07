import fs from 'fs';
import { should } from 'chai';
import Images from './images';
import Mustache from 'mustache';

// Use "should" style chai testing
should();

// Arrow functions not used because the context of "this" gets lost
describe('images', function() {
  let test_image_path = __dirname + '/../build/icons/512x512.png';

  it('can add images', function() {
    Images.add(test_image_path);
    return Images.getAll().should.have.members([test_image_path]);
  });

  it('can remove images', function() {
    Images.remove(test_image_path);
    return Images.getAll().should.not.have.members([test_image_path]);
  });

});
