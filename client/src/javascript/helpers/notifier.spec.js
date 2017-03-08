import { spy } from 'sinon';
import { should as chaiShould } from 'chai';
import Notifier from './notifier';

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

  ['success', 'info', 'warning', 'danger'].forEach(type =>
    it(`can send a ${type} notification`, (done) => {
      const msg = `This is a ${type} message`;
      Notifier[type](msg);
      eventSpy.calledOnce.should.be.ok;
      eventSpy.firstCall.args[0].detail.type.should.be.equal(type);
      eventSpy.firstCall.args[0].detail.message.should.be.equal(msg);
      done();
    })
  );
});

