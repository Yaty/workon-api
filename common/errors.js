'use strict';

function factory(status, message, code) {
  const error = new Error();
  error.status = status;
  error.message = message;
  error.code = code;
  return error;
}

module.exports = {
  unauthorized() {
    return factory(401, 'Authorization Required', 'AUTHORIZATION_REQUIRED');
  },
};
