const chai = require('chai');
const thumbTools = require('../middleware/thumbnails');

// Use should style testing
const should = chai.should();

describe('Thumbnails API', () => {
  const test_image_path = 'tests/test_image.jpg';

  it('throws 400 on invalid parameters', done =>
    thumbTools.generate(test_image_path, 'meeedium', 'fatten', (err, message) => {
      err.should.equal(400);
      message.should.be.a('string');
      done();
    })
  );

  it('throws 500 on invalid images', done =>
    thumbTools.generate(`${test_image_path}_nope`, 'md', 'fit', (err, message) => {
      err.should.equal(500);
      message.should.not.be.instanceof(Buffer);
      done();
    })
  );

  // Test all the crop types and size combos
  Object.keys(thumbTools.sizeMap).forEach(size =>
    Object.keys(thumbTools.cropMap).forEach(cropping =>
      it(`Can generate a ${size} thumbnail with ${cropping} cropping`, done =>
        thumbTools.generate(test_image_path, size, cropping, (err, buffer, info) => {
          should.not.exist(err);
          buffer.should.be.instanceof(Buffer);
          info.format.should.equal('jpeg');
          if (cropping !== 'growx') {
            info.width.should.equal(thumbTools.sizeMap[size][0]);
          }
          if (cropping !== 'growy' && cropping !== 'fill') {
            info.height.should.equal(thumbTools.sizeMap[size][1]);
          }

          // Test image is rectangular - this should pass
          if (cropping !== 'fit') {
            info.width.should.not.equal(info.height);
          }
          done();
        })
      )
    )
  );
});
