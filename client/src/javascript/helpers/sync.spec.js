import path from 'path';
import Nock from 'nock';
import fs from 'fs';
import { Readable } from 'stream';
import { stub } from 'sinon';
import { should as chaiShould } from 'chai';
import Sync from './sync';
import Images from '../models/images';
import Host from '../models/host';
import Galleries from '../models/galleries';

const should = chaiShould();

describe('Sync helper', () => {
  const headers = {
    'set-cookie': ['connect.sid=s%3AoSOmSsKxRUsMYJV-HdXv-05NeXU7BVEe.n%2FHVO%2FKhZfaecG7DUx2afovn%2FW2MMdsV9q33AgaHqP8; Path=/; HttpOnly']
  };
  const fakeRemote = 'hiIamAveryUnlikelyREMOTE';
  const badRemote = 'EZpzlemonsqEZ';
  const testImagePath = path.join(__dirname, '../build/icons/512x512.png');
  let testImage;
  let fsWriteStub;

  before((done) => {
    fsWriteStub = stub(fs, 'createWriteStream').returns(new Readable());
    Images.add(testImagePath, (inserted_image) => {
      testImage = inserted_image;
      // NOTE logging in so that Host.isAuthed() returns true
      Nock(Host.server_uri)
        .post('/user/login')
        .reply(200, { status: 200 }, headers);
      Host.login('Sully', 'MyPlumbusMyPlumbusMyVacaForAPlumbus', () => {
        done();
      });
    });
  });

  after((done) => {
    fsWriteStub.restore();
    done();
  });

  beforeEach(() => {
    Galleries.should_save = false;
  });

  describe('uploading images', () => {
    it('should be able to sync an image', (done) => {
      Nock(Host.server_uri)
      .post('/image/upload')
      .reply(200, { 'image-ids': [fakeRemote], message: 'its ALIVEEE' });

      Sync.uploadImages([testImage.$loki], () => {
        Images.get(testImage.$loki, (image) => {
          image.remoteId.should.equal(fakeRemote);
          testImage.remoteId = image.remoteId;
          done();
        });
      });
    });

    it('should not be able to sync an already synced image', (done) => {
      Sync.uploadImages([testImage.$loki], (res) => {
        res.should.deep.equal([testImage.remoteId]);
        done();
      });
    });
  });

  describe('downloading images', () => {
    it('should be able to download an image', (done) => {
      Nock(Host.server_uri)
        .log(console.log)
        .get(`/image/${fakeRemote}`)
        .replyWithFile(200, testImagePath, { 'content-type': 'image/png' });
      Sync.downloadImage(fakeRemote, (err, filePath) => {
        should.not.exist(err);
        filePath.should.exist;
        done();
      });
    });
  });

  describe('sharing images', () => {
    it('should fail to share an invalid remote', (done) => {
      Nock(Host.server_uri)
        .post(`/image/${badRemote}/share`)
        .reply(400, { error: 'invalid something or other !?' }, headers);

      Sync.shareImage(badRemote, (err) => {
        err.should.exist;
        done();
      });
    });

    it('should share an image with a vaild remote', (done) => {
      Nock(Host.server_uri)
        .post(`/image/${fakeRemote}/share`)
        .reply(200, { message: 'id like to have an argument please' });

      Sync.shareImage(fakeRemote, (err, uri) => {
        uri.should.equal(Host.server_uri.concat(`/image/${fakeRemote}`));
        done();
      });
    });
  });

  describe('unsharing images', () => {
    it('should fail to unshare an invalid remote', (done) => {
      Nock(Host.server_uri)
        .post(`/image/${badRemote}/unshare`)
        .reply(400, { error: 'invalid something or other !?' }, headers);

      Sync.unshareImage(badRemote, (err) => {
        err.should.exist;
        done();
      });
    });

    it('should unshare an image with a vaild remote', (done) => {
      Nock(Host.server_uri)
        .post(`/image/${fakeRemote}/unshare`)
        .reply(200, { message: 'id like to have an argument please' });

      Sync.unshareImage(fakeRemote, (err) => {
        should.not.exist(err);
        done();
      });
    });
  });

  describe('removing images', () => {
    it('should fail to remove an invalid remote', (done) => {
      Nock(Host.server_uri)
        .post(`/image/${badRemote}/remove`)
        .reply(400, { error: 'invalid something or other !?' }, headers);

      Sync.removeSynced(badRemote, (err) => {
        err.should.exist;
        done();
      });
    });

    it('should remove an image from the server with Images.remove', (done) => {
      const req = Nock(Host.server_uri)
        .post(`/image/${fakeRemote}/remove`)
        .reply(200, { message: '>tfw tests pass' }, headers);

      Images.remove(testImage.$loki, () => {
        should.equal(req.isDone(), true);
        done();
      });
    });
  });
});
