'use strict';

const supertest = require('supertest');
const app = require('../server/server');

module.exports = supertest(app);
