'use strict';

const {expect} = require('chai');
const api = require('./api');

function generateAccountData() {
  return {
    username: self.uuid(),
    email: self.uuid() + '@' + self.uuid() + '.fr',
    password: self.uuid(),
    lastname: self.uuid(),
    firstname: self.uuid(),
  };
}

const self = module.exports = {
  uuid() {
    return String(Math.random()).substring(2);
  },
  isValidValidationError(body, expectedDetails) {
    expect(body).to.be.an('object');
    expect(body).to.have.property('error').to.be.an('object');
    expect(body.error.statusCode).to.be.equal(422);
    expect(body.error.message).to.be.an('string');
    expect(body.error.details).to.be.an('object');

    for (const [key, {codes, messages}] of Object.entries(expectedDetails)) {
      expect(body.error.details.codes[key]).to.be.an('array');
      expect(body.error.details.messages[key]).to.be.an('array');

      for (const code of codes) {
        expect(body.error.details.codes[key]).to.include(code);
      }

      for (const message of messages) {
        expect(body.error.details.messages[key]).to.include(message);
      }
    }
  },
  createAccount(data) {
    return new Promise((resolve, reject) => {
      api.post('/api/accounts')
        .send(data)
        .end((err, res) => {
          if (err) return reject(err);
          return resolve(res.body);
        });
    });
  },
  accountFactory(number) {
    const data = Array.from({length: number}, generateAccountData);
    return Promise.all(data.map(account => self.createAccount(account)));
  },
};
