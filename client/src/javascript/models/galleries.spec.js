import jetpack from 'fs-jetpack';
import path from 'path';
import { use, should as chaiShould } from 'chai';
import chaiThings from 'chai-things';
import Galleries from './galleries';
import Images from './images';

// Use 'should' style chai testing
const should = chaiShould();
use(chaiThings);

describe('Galleries model', () => {
  const base_gallery_id = 1;
  const test_gallery_name = 'Land Rovers';
  const test_subgallery_name = 'Series III';
  const fakeRemote = 'landluver23*3';
  const test_image_path = path.join(__dirname, '../build/icons/512x512.png');
  let test_gallery;
  let test_image;
  let test_subgallery;

  beforeEach(() => {
    Galleries.should_save = false;
  });

  // Create a test image
  before(done =>
    Images.add(test_image_path, (inserted_image) => {
      test_image = inserted_image;
      done();
    })
  );

  // Remove test image
  after(() =>
    Images.remove(test_image.$loki, () => true)
  );

  it('can add gallery', done =>
    Galleries.add(test_gallery_name, (inserted_gallery) => {
      inserted_gallery.$loki.should.be.a('number');
      inserted_gallery.images.should.be.an('array');
      inserted_gallery.subgalleries.should.be.an('array');
      test_gallery = inserted_gallery;
      done();
    })
  );

  it('won\'t duplicate gallery', done =>
    Galleries.add(test_gallery_name, (inserted_gallery) => {
      inserted_gallery.$loki.should.be.equal(test_gallery.$loki);
      done();
    })
  );

  it('won\'t add gallery with blank name', done =>
    Galleries.add('', (inserted_gallery) => {
      should.not.exist(inserted_gallery);
      done();
    })
  );

  it('can query gallery by id', done =>
    Galleries.get(test_gallery.$loki, (queried_gallery) => {
      queried_gallery.should.be.equal(test_gallery);
      done();
    })
  );

  it('can query gallery by name', done =>
    Galleries.getName(test_gallery.name, (queried_gallery) => {
      queried_gallery.should.be.equal(test_gallery);
      done();
    })
  );

  it('adds new gallery to base gallery', done =>
    Galleries.get(base_gallery_id, (queried_gallery) => {
      queried_gallery.subgalleries.should.include.something.that.equals(test_gallery.$loki);
      done();
    })
  );

  it('can add item to gallery', done =>
    Galleries.addItem(test_gallery.$loki, test_image.$loki, (updated_gallery) => {
      updated_gallery.images.should.contain(test_image.$loki);
      test_gallery = updated_gallery;
      done();
    })
  );

  it('wont\'t duplicate items in gallery', done =>
    Galleries.addItem(test_gallery.$loki, test_image.$loki, (updated_gallery) => {
      updated_gallery.images.should.contain(test_image.$loki);
      updated_gallery.images.should.be.equal(test_gallery.images);
      done();
    })
  );

  it('can\'t add item to non-existant gallery', done =>
    Galleries.addItem(999, test_image.$loki, (updated_gallery) => {
      should.not.exist(updated_gallery);
      done();
    })
  );

  it('can expand gallery and pick thumbnails', done =>
    Galleries.get(base_gallery_id, base_gallery =>
      Galleries.expand(base_gallery, {}, (subgalleries) => {
        subgalleries.should.include.something.with.property('thumbnail');
        done();
      })
    )
  );

  it('can add a subgallery to a gallery', (done) => {
    Galleries.add(test_subgallery_name, (subgallery) => {
      test_subgallery = subgallery;
      subgallery.should.be.an('object');
      subgallery.name.should.be.equal(test_subgallery_name);
      Galleries.addSubGallery(
        test_gallery.$loki,
        subgallery.$loki,
        (updated_gallery) => {
          updated_gallery.subgalleries.should.contain(subgallery.$loki);
          test_gallery = updated_gallery;
          done();
        }
      );
    });
  });

  it('can expand gallery with name filter', done =>
    Galleries.get(base_gallery_id, base_gallery =>
      Galleries.expand(base_gallery, { name: test_gallery_name }, (subgalleries) => {
        subgalleries.should.have.lengthOf(1);
        done();
      })
    )
  );

  it('can expand gallery with rating filter', done =>
    Galleries.get(base_gallery_id, base_gallery =>
      Galleries.expand(base_gallery, { rating: 3 }, (subgalleries) => {
        subgalleries.should.have.lengthOf(0);
        done();
      })
    )
  );

  it('can update rating metadata for a gallery', (done) => {
    const metadata = { rating: 4, tags: test_gallery.metadata.tags };
    Galleries.updateMetadata(test_gallery.$loki, metadata, (updatedGallery) => {
      updatedGallery.metadata.rating.should.equal(4);
      done();
    });
  });

  it('can update tag metadata for a gallery', (done) => {
    const metadata = { rating: test_gallery.metadata.rating, tags: ['test'] };
    Galleries.updateMetadata(test_gallery.$loki, metadata, (updatedGallery) => {
      updatedGallery.metadata.tags.should.include('test');
      done();
    });
  });

  it('can expand gallery with tag filter', done =>
    Galleries.get(base_gallery_id, base_gallery =>
      Galleries.expand(base_gallery, { tag: 'test' }, (subgalleries) => {
        subgalleries.should.have.lengthOf(1);
        done();
      })
    )
  );

  it('can\'t duplicate subgallery', (done) => {
    Galleries.addSubGallery(
      test_gallery.$loki,
      test_subgallery.$loki,
      (updated_gallery) => {
        updated_gallery.should.exist;
        updated_gallery.subgalleries.length.should.be.equal(test_gallery.subgalleries.length);
        done();
      }
    );
  });

  it('can\'t add a gallery to itself', (done) => {
    Galleries.addSubGallery(
      test_gallery.$loki,
      test_gallery.$loki,
      (updated_gallery) => {
        should.not.exist(updated_gallery);
        done();
      }
    );
  });

  it('can\'t use base gallery as a subgallery', (done) => {
    Galleries.addSubGallery(
      test_gallery.$loki,
      base_gallery_id,
      (updated_gallery) => {
        should.not.exist(updated_gallery);
        done();
      }
    );
  });

  it('can\'t add subgallery to non-existent gallery', (done) => {
    Galleries.addSubGallery(
      999,
      test_gallery.$loki,
      (updated_gallery) => {
        should.not.exist(updated_gallery);
        done();
      }
    );
  });

  it('can set gallery remote id', done =>
    Galleries.addRemoteId(base_gallery_id, fakeRemote, (updatedGallery) => {
      updatedGallery.remoteId.should.equal(fakeRemote);
      done();
    })
  );

  it('can add item to subgallery', done =>
    Galleries.addItem(test_subgallery.$loki, test_image.$loki, (updated_gallery) => {
      updated_gallery.images.should.contain(test_image.$loki);
      test_subgallery = updated_gallery;
      done();
    })
  );

  it('can remove item from gallery', done =>
    Galleries.removeItem(test_subgallery.$loki, test_image.$loki, (updated_gallery) => {
      updated_gallery.images.should.not.contain(test_image.$loki);
      test_subgallery = updated_gallery;
      done();
    })
  );

  it('can expand gallery without thumbnails', done =>
    Galleries.expand(test_gallery, {}, (subgalleries, images) => {
      test_gallery.subgalleries.should.not.have.length(0);
      subgalleries.should.not.be.empty;
      subgalleries.should.all.have.property('thumbnail', null);
      images.should.all.have.property('location');
      done();
    })
  );

  it('can convert a gallery to a group', done =>
    Galleries.convertToGroup(test_subgallery.$loki, 'fakeMongoId', (updated_gallery) => {
      updated_gallery.group.should.be.ok;
      test_subgallery = updated_gallery;
      done();
    })
  );

  it('can remove a subgallery from a gallery', (done) => {
    Galleries.remove(test_subgallery.$loki, () => {
      test_gallery.subgalleries.should.not.include(test_subgallery.$loki);
      Galleries.get(test_subgallery.$loki, (removed_gallery) => {
        should.not.exist(removed_gallery);
        done();
      });
    });
  });

  it('can remove an item from the db and fs', (done) => {
    jetpack.copy(test_image_path, `${test_image_path}_orig`, { overwrite: true });
    Galleries.deleteItem(test_image.$loki, () =>
      Galleries.get(test_gallery.$loki, (updated_gallery) => {
        updated_gallery.images.should.not.contain(test_image.$loki);
        jetpack.exists(test_image_path).should.not.be.ok;
        jetpack.move(`${test_image_path}_orig`, test_image_path);
        test_gallery = updated_gallery;
        done();
      })
    );
  });

  it('can safely try to remove from non-existant gallery', done =>
    Galleries.removeItem(999, test_image.$loki, (updated_gallery) => {
      should.not.exist(updated_gallery);
      done();
    })
  );

  it('can remove gallery', (done) => {
    const id = test_gallery.$loki;
    Galleries.remove(id, () =>
      Galleries.get(id, (removed_gallery) => {
        should.not.exist(removed_gallery);
        done();
      })
    );
  });

  it('can\'t remove the base gallery', (done) => {
    Galleries.remove(base_gallery_id, () =>
      Galleries.get(base_gallery_id, (removed_gallery) => {
        should.exist(removed_gallery);
        done();
      })
    );
  });
});
