import { expect } from 'chai';
import testUtils from './utils';

describe('application launch', _ => {

  beforeEach(testUtils.beforeEach);
  afterEach(testUtils.afterEach);

  it('opens empty page', function() {
    let app = this.app;
    return app.client.getText('#main-content').then(function(text) {
      expect(text).to.be.empty;

      return app.client.getText('#hover-content').then(function(text) {
        expect(text).to.be.empty;
      });
    });
  });
});
