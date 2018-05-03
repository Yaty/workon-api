'use strict';

const {expect} = require('chai');

module.exports = {
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
};
