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

function generateProjectData() {
  return {
    name: self.uuid(),
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
  createAccount(data = generateAccountData()) {
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
  addWorker(projectId, workerId) {
    return new Promise((resolve, reject) => {
      api.put('/api/projects/' + projectId + '/workers/rel/' + workerId)
        .end((err, res) => {
          if (err) return reject(err);
          return resolve(res.body);
        });
    });
  },
  addWorkers(projectId, workerIds) {
    return Promise.all(workerIds.map(wId => self.addWorkers(projectId, wId)));
  },
  getProject(id) {
    return new Promise((resolve, reject) => {
      api.get('/api/projects/' + id + '?filter[include]=workers')
        .end((err, res) => {
          if (err) return reject(err);
          return resolve(res.body);
        });
    });
  },
  async createProject(data = generateProjectData(), directorId, workers) {
    directorId = directorId || (await self.createAccount()).id;
    workers = await self.accountFactory(workers);

    return new Promise((resolve, reject) => {
      api.post('/api/projects')
        .send({
          ...data,
          directorId,
        })
        .end(async (err, res) => {
          if (err) return reject(err);
          await self.addWorkers(res.body.id, workers.map(w => w.id));
          return resolve(await self.getProject(res.body.id));
        });
    });
  },
};
