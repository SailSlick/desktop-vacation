import { expect } from 'chai';
import DbConn from './db';
import slide from './slideshow-client';

const hostname = 'Sully';

describe('Slideshow Feature', () => {
  const hostCol = new DbConn('host');

  describe('ss#setSlideshowOpts()', () => {
    it('Can set slideshow options', () => {
      slide.setSlideshow(hostname.concat('_all'), 30);
      hostCol.findOne({ username: { $gte: '' } }, (doc) => {
        //expect(doc.slideshowConfig.onstart).to.be.ok;
      });
    });
  });

  describe('ss#clearSlideshowOpts()', () => {
    it('Can clear slideshow options', () => {
      slide.clearSlideshow();
      hostCol.findOne({ username: { $gte: '' } }, (doc) => {
        expect(doc.slideshowConfig.onstart).to.not.be.ok;
      });
    });
  });

  describe('ss#sleep()', () => {
    it('Can sleep for correct time', (done) => {
      done();
    });
  });

  describe('ss#MainLoop()', () => {
    it('Can loop through all images in db', (done) => {
      done();
    });

    it('Should quit when told to', (done) => {
      done();
    });
  });

  describe('ss#setBackground()', () => {
    it('Can set background when told', (done) => {
      done();
    });
  });
});
