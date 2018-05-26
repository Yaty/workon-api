'use strict';

const api = require('../api');
const {expect} = require('chai');
const {uuid, isValidValidationError} = require('../utils');

describe('Account creation', function() {
  let account;

  beforeEach(function() {
    account = {
      username: uuid(),
      email: uuid() + '@' + uuid() + '.fr',
      password: uuid(),
      lastname: uuid(),
      firstname: uuid(),
    };
  });

  describe('ACL', function() {
  });

  it('create an account', function(done) {
    api.post('/api/accounts')
      .send(account)
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        delete account.password;
        expect(res.body).to.be.an('object');

        for (const [key, value] of Object.entries(account)) {
          expect(res.body[key]).to.be.equal(value);
        }

        expect(res.body).to.have.property('id');

        done();
      });
  });

  it('should require a password', function(done) {
    delete account.password;

    api.post('/api/accounts')
      .send(account)
      .expect(422)
      .end(function(err, res) {
        if (err) return done(err);
        isValidValidationError(res.body, {
          password: {
            codes: ['presence'],
            messages: ['can\'t be blank'],
          },
        });
        done();
      });
  });
});
