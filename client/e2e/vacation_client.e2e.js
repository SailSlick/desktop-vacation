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
           .getText('#react-content').should.eventually.be.not.empty;
  });

  it('can display opened images', function () {
    return this.app.client.waitUntilWindowLoaded()
           .webContents.send('selected-directory', [test_image_path])
           .element('.img-card').should.eventually.exist;
  });

  it('can expand opened images', function () {
    return this.app.client.waitUntilWindowLoaded()
           .getText('#react-content').should.eventually.be.not.empty
           .click('.img-card img')
           .element('.modal-body img').should.eventually.exist;
  });

// This cannot be properly tested due to an open issue with
// asynchronous IPC calls
// See: https://github.com/electron/spectron/issues/98
  it('can set the desktop background', function () {
    return this.app.client.waitUntilWindowLoaded()
           .electron.ipcRenderer.send('set-wallpaper', test_image_path)
           .element('#notification p').should.eventually.be.not.empty;
  });
});
