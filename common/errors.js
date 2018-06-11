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
  userNotFound() {
    return factory(404, 'User Not Found', 'USER_NOT_FOUND');
  },
  forbidden() {
    return factory(403, 'Forbidden', 'FORBIDDEN');
  },
  roleNotFound() {
    return factory(404, 'Role Not Found', 'ROLE_NOT_FOUND');
  },
};
