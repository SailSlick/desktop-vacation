import { should as chaiShould } from 'chai';
import './app';

// Use 'should' style chai testing
chaiShould();

// Arrow functions not used because the context of 'this' gets lost
describe('app', () => {
  it('should eventually load', done =>
    document.addEventListener('vacation_loaded', _ => done(), false)
  );
});
