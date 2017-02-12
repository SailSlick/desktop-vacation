import { should, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import testUtils from './utils';

// Use "should" style chai testing
should();
use(chaiAsPromised);

// Arrow functions not used because the context of "this" gets lost
describe('application launch', function () {
  const test_image_path = `${__dirname}/../build/icons/512x512.png`;

  beforeEach(testUtils.beforeEach);

  // Required when using chai as promised so that .eventually works
  beforeEach(function () {
    chaiAsPromised.transferPromiseness = this.app.transferPromiseness;
  });

  afterEach(testUtils.afterEach);

  it('loads home page', function () {
    return this.app.client.waitUntilWindowLoaded()
           .getText('#main-content').should.eventually.be.empty
           .getText('#hover-content').should.eventually.be.empty;
  });

  it('can display opened images', function () {
    return this.app.client.waitUntilWindowLoaded()
           .webContents.send('selected-directory', [test_image_path])
           .getText('#main-content').should.eventually.be.not.empty;
  });

  it('can expand opened images', function () {
    return this.app.client.waitUntilWindowLoaded()
           .webContents.send('selected-directory', [test_image_path])
           .getText('#main-content').should.eventually.be.not.empty
           .click('#main-content img')
           .element('#img-expanded').should.eventually.exist;
  });
});
