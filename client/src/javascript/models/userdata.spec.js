import { should as chaiShould } from 'chai';
import Userdata from './userdata';

// Use 'should' style chai testing
const should = chaiShould();

// Arrow functions not used because the context of 'this' gets lost
describe('userdata', () => {
  const test_username = 'Landyboi';
  let test_data;

  it('can add user', done =>
    Userdata.add(test_username, (inserted_data) => {
      inserted_data.$loki.should.be.a('number');
      test_data = inserted_data;
      done();
    })
  );

  it('won\'t duplicate user', done =>
    Userdata.add(test_username, (inserted_data) => {
      inserted_data.$loki.should.be.equal(test_data.$loki);
      done();
    })
  );

  it('can query user', done =>
    Userdata.get(test_username, (queried_data) => {
      queried_data.should.be.equal(test_data);
      done();
    })
  );

  it('can update user', done =>
    Userdata.update(
      test_username,
      { test_field: true },
      (updated_data) => {
        should.exist(updated_data.test_field);
        updated_data.$loki.should.be.equal(test_data.$loki);
        done();
      }
    )
  );

  it('can remove user', (done) => {
    Userdata.remove(test_username);
    Userdata.get(test_username, (removed_data) => {
      should.not.exist(removed_data);
      done();
    });
  });
});
