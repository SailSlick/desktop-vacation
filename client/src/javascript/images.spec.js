import fs from 'fs';
import { expect } from 'chai';
import Images from './images';
import Mustache from 'mustache';

describe('images', _ => {
  var test_image_path = __dirname + '/../build/icons/512x512.png';

  it('can add images', _ => {
    Images.add(test_image_path);
    return expect(Images.getAll()).to.have.members([test_image_path]);
  });

  it('can remove images', _ => {
    Images.remove(test_image_path);
    return expect(Images.getAll()).to.not.have.members([test_image_path]);
  });

});
