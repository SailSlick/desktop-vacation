import { spy } from 'sinon';
import { should as chaiShould } from 'chai';
import { updateProgressBar, endProgressBar } from './progress';

// Use 'should' style chai testing
chaiShould();

describe('Notifier', () => {
  let eventSpy;

  beforeEach(() => {
    eventSpy = spy(document, 'dispatchEvent');
  });

  afterEach(() => {
    eventSpy.restore();
  });

  it('can update the progress bar', (done) => {
    updateProgressBar(100, 'Updating maymays:');
    eventSpy.calledOnce.should.be.ok;
    eventSpy.firstCall.args[0].detail.size.should.be.equal(100);
    eventSpy.firstCall.args[0].detail.message.should.be.equal('Updating maymays:');
    done();
  });

  it('can end the progress bar', (done) => {
    endProgressBar();
    eventSpy.calledOnce.should.be.ok;
    done();
  });
});
