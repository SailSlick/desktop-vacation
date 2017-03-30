import path from 'path';
import { should as chaiShould } from 'chai';
import Images from './images';

// Use 'should' style chai testing
const should = chaiShould();

describe('Images model', () => {
  const test_image_path = path.join(__dirname, '../build/icons/512x512.png');
  let test_image;

  it('can add image', done =>
    Images.add(test_image_path, (inserted_image) => {
      inserted_image.$loki.should.be.a('number');
      test_image = inserted_image;
      done();
    })
  );

  it('won\'t duplicate image', done =>
    Images.add(test_image_path, (inserted_image) => {
      inserted_image.$loki.should.be.equal(test_image.$loki);
      done();
    })
  );

  it('can query image', done =>
    Images.get(test_image.$loki, (queried_image) => {
      queried_image.should.be.equal(test_image);
      done();
    })
  );

  it('can update rating metadata for an image', (done) => {
    const metadata = { rating: 4, tags: test_image.metadata.tags };
    Images.update(test_image.$loki, { metadata }, (updatedImage) => {
      updatedImage.metadata.rating.should.equal(4);
      done();
    });
  });

  it('can update tags metadata for an image', (done) => {
    const metadata = { rating: test_image.metadata.rating, tags: ['test'] };
    Images.update(test_image.$loki, { metadata }, (updatedImage) => {
      updatedImage.metadata.tags.should.include('test');
      done();
    });
  });

  it('can remove image', (done) => {
    const id = test_image.$loki;
    Images.remove(id, () =>
      Images.get(id, (removed_image) => {
        should.not.exist(removed_image);
        done();
      })
    );
  });
});
