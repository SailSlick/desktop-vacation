import path from 'path';
import $ from 'jquery';
import { should, expect } from 'chai';
import DbConn from './db';
import Galleries from './galleries';
import Images from './images';
import '../app';

should();

describe('Galleries', () => {
  $(document).on('database_loaded', () => {
    const galleryDb = new DbConn('galleries');
    Images.image_db = new DbConn('images');
    const testGalleryName = '__test__';
    const test_image_path = path.join(__dirname, '../build/icons/512x512.png');

    describe('Gallery - Add', () => {
      after((done) => {
        Galleries.remove(testGalleryName, (err) => {
          galleryDb.save(() => done(err));
        });
      });

      it('can add a new gallery', (done) => {
        Galleries.add(testGalleryName, (err) => {
          galleryDb.findOne({ name: testGalleryName }, (found) => {
            found.should.be.an('object');
            found.name.should.equal(testGalleryName);
            done(err);
          });
        });
      });

      it('cant add a gallery using the base gallery name', (done) => {
        Galleries.add(Galleries.baseName, (err) => {
          err.should.be.a('string');
          done();
        });
      });

      it('cant add a gallery with a blank name', (done) => {
        Galleries.add('', (err) => {
          err.should.be.a('string');
          done();
        });
      });
    });

    describe('Gallery - Remove', () => {
      before(done => Galleries.add(testGalleryName, () => done()));
      after(done => galleryDb.save(() => done()));

      it('can remove a gallery', (done) => {
        Galleries.remove(testGalleryName, (err) => {
          galleryDb.findOne({ name: testGalleryName }, (doc) => {
            expect(doc).to.equal(null);
            done(err);
          });
        });
      });

      it('fails to remove blank gallery', (done) => {
        Galleries.remove('', (err) => {
          err.should.be.a('string');
          done();
        });
      });

      it('fails to remove base gallery', (done) => {
        Galleries.remove(Galleries.baseName, (err) => {
          err.should.be.a('string');
          done();
        });
      });
    });

    describe('Gallery - Images', () => {
      let test_image_id;

      before((done) => {
        Images.add(test_image_path);
        Galleries.add(testGalleryName, () => {
          done();
        });
      });

      after((done) => {
        Images.remove(test_image_path);
        Galleries.remove(testGalleryName, err => galleryDb.save(() => done(err)));
      });

      it('Can add an image to a gallery', (done) => {
        Images.image_db.findOne({ location: test_image_path }, (image) => {
          test_image_id = image.$loki;
          Galleries.addItem(testGalleryName, test_image_id, err => done(err));
        });
      });

      it('Get all images in a gallery', (done) => {
        Galleries.forAllImages(testGalleryName, (image) => {
          image.$loki.should.equal(test_image_id);
          done();
        });
      });

      it('Remove an image from a gallery', (done) => {
        Galleries.removeItem(testGalleryName, test_image_id, err => done(err));
      });
    });

    describe('Gallery - Subgalleries', () => {
      const testSubgalleryName = '__TestSubGallery__';

      before(done => Galleries.add(testGalleryName, () => done()));

      after((done) => {
        Galleries.remove(testGalleryName, (err) => {
          galleryDb.save(() => done(err));
        });
      });

      it('Add a subgallery for a gallery', (done) => {
        Galleries.currentGallery = testGalleryName;
        Galleries.add(testSubgalleryName, (err) => {
          galleryDb.findOne({ name: testSubgalleryName }, (found_subgallery) => {
            found_subgallery.should.be.an('object');
            found_subgallery.name.should.equal(testSubgalleryName);
            galleryDb.findOne({ name: testGalleryName }, (found_base) => {
              found_base.should.be.an('object');
              found_base.name.should.equal(testGalleryName);
              expect(found_base.subgallaries).to.include(found_subgallery.$loki);
              done(err);
            });
          });
        });
      });

      it('Remove a subgallery from a gallery', (done) => {
        Galleries.currentGallery = '';
        Galleries.remove(testSubgalleryName, (err) => {
          galleryDb.findOne({ name: testGalleryName }, (found) => {
            found.should.be.an('object');
            found.name.should.equal(testGalleryName);
            expect(found.subgallaries).not.to.include(testSubgalleryName);
            done(err);
          });
        });
      });
    });
  });
});
