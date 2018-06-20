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
  login(username, password) {
    return new Promise((resolve, reject) => {
      api.post('/api/accounts/login')
        .send({
          username,
          password,
        })
        .end((err, res) => {
          if (err) return reject(err);
          return resolve(res.body);
        });
    });
  },
  async accountFactory(number, options = {}) {
    const data = Array.from({length: number}, generateAccountData);
    const accounts = await Promise.all(
      data.map(account => self.createAccount(account))
    );

    if (options.login) {
      for (const account of accounts) {
        const {username, password} = data.find(a => {
          return a.username === account.username;
        });

        const {id} = await self.login(username, password);
        account.token = id;
      }
    }

    return accounts;
  },
  getProject(accountId, projectId, accountToken) {
    return new Promise((resolve, reject) => {
      api.get(
        '/api/accounts/' + accountId +
        '/projects/' + projectId
      )
        .set('Authorization', 'Bearer ' + accountToken)
        .end((err, res) => {
          if (err) return reject(err);
          return resolve(res.body);
        });
    });
  },
  addAccountToProject(accountId, projectId, directorId, directorToken) {
    return new Promise((resolve, reject) => {
      api.put(
        '/api/accounts/' + directorId +
        '/projects/' + projectId +
        '/accounts/rel/' + accountId
      )
        .set('Authorization', 'Bearer ' + directorToken)
        .end((err, res) => {
          if (err) return reject(err);
          return resolve(res.body);
        });
    });
  },
  addAccountsToProject(accountIds, projectId, directorToken) {
    return Promise.all(accountIds.map((aId) => {
      return self.addAccountToProject(aId, projectId, directorToken);
    }));
  },
  async createProject(nbWorkers, dir) {
    const [accounts] = await self.accountFactory(nbWorkers, {
      login: true,
    });

    if (!dir) {
      [dir] = await self.accountFactory(1, {
        login: true,
      });
    }

    return new Promise((resolve, reject) => {
      api.post('/api/accounts/' + dir.id + '/projects')
        .set('Authorization', 'Bearer ' + dir.token)
        .send(generateProjectData())
        .end(async (err, res) => {
          if (err) return reject(err);

          if (accounts && accounts.length > 0) {
            await self.addAccountsToProject(
              accounts.map(w => w.id),
              res.body.id,
              dir.token,
            );
          }

          return resolve(await self.getProject(dir.id, res.body.id, dir.token));
        });
    });
  },
  getCollaborator(accountId, collaboratorId, accountToken) {
    return new Promise((resolve, reject) => {
      api.get('/api/accounts/' + accountId + '/collaborators/' + collaboratorId)
        .set('Authorization', 'Bearer ' + accountToken)
        .end((err, res) => {
          if (err) return reject(err);
          return resolve(res.body);
        });
    });
  },
  createThread(accountId, accountToken) {
    return new Promise((resolve, reject) => {
      api.post('/api/accounts/' + accountId + '/threads')
        .set('Authorization', 'Bearer ' + accountToken)
        .send({
          name: String(Math.random()),
        })
        .end((err, res) => {
          if (err) return reject(err);
          return resolve(res.body);
        });
    });
  },
  getMessage(accountId, messageId, accountToken) {
    return new Promise((resolve, reject) => {
      api.get('/api/accounts/' + accountId + '/messages/' + messageId)
        .set('Authorization', 'Bearer ' + accountToken)
        .end((err, res) => {
          if (err) return reject(err);
          return resolve(res.body);
        });
    });
  },
  getThread(accountId, threadId, accountToken) {
    return new Promise((resolve, reject) => {
      api.get('/api/accounts/' + accountId + '/threads/' + threadId)
        .set('Authorization', 'Bearer ' + accountToken)
        .end((err, res) => {
          if (err) return reject(err);
          return resolve(res.body);
        });
    });
  },
  createRole(projectId, directorId, directorToken) {
    return new Promise((resolve, reject) => {
      api.post(
        '/api/accounts/' + directorId +
        '/projects/' + projectId + '/roles'
      )
        .set('Authorization', 'Bearer ' + directorToken)
        .send({
          name: String(Math.random()),
        })
        .end((err, res) => {
          if (err) return reject(err);
          return resolve(res.body);
        });
    });
  },
  getAccountRoleById(accountId, roleId, accountToken) {
    return new Promise((resolve, reject) => {
      api.get('/api/accounts/' + accountId + '/roles/' + roleId)
        .set('Authorization', 'Bearer ' + accountToken)
        .end((err, res) => {
          if (err) return reject(err);
          return resolve(res.body);
        });
    });
  },
  getAccountsInProject(accountId, projectId, accountToken) {
    return new Promise((resolve, reject) => {
      api.get(
        '/api/accounts/' + accountId +
        '/projects/' + projectId + '/accounts'
      )
        .set('Authorization', 'Bearer ' + accountToken)
        .end((err, res) => {
          if (err) return reject(err);
          return resolve(res.body);
        });
    });
  },
  getAccountRolesInProject(accountId, projectId, accountToken) {
    return new Promise((resolve, reject) => {
      api.get(
        '/api/accounts/' + accountId + '/roles' +
        '?filter={"where":{"projectId":"' + projectId + '"}}'
      )
        .set('Authorization', 'Bearer ' + accountToken)
        .end((err, res) => {
          if (err) return reject(err);
          return resolve(res.body);
        });
    });
  },
  getProjectDirectors(projectId, accountToken) {
    return new Promise((resolve, reject) => {
      api.get(
        '/api/projects/' + projectId +
        '/roles?filter={"include":{"relation":"accounts"}}'
      )
        .set('Authorization', 'Bearer ' + accountToken)
        .end((err, res) => {
          if (err) return reject(err);
          return resolve(res.body.filter((role) => role.name === 'director'));
        });
    });
  },
  createBug(accountId, accountToken, projectId) {
    return new Promise((resolve, reject) => {
      const bug = {
        name: self.uuid(),
        state: self.uuid(),
        description: self.uuid(),
      };

      api.post(
        '/api/accounts/' +  accountId +
        '/projects/' + projectId +
        '/bugs'
      )
        .set('Authorization', 'Bearer ' + accountToken)
        .send(bug)
        .end((err, res) => {
          if (err) return reject(err);
          return resolve(res.body);
        });
    });
  },
  getBug(bugId, accountToken) {
    return new Promise((resolve, reject) => {
      api.get(
        '/api/bugs/' + bugId +
        '?filter={"include":{"relation":"assignees"}}'
      )
        .set('Authorization', 'Bearer ' + accountToken)
        .end((err, res) => {
          if (err) return reject(err);
          return resolve(res.body);
        });
    });
  },
};
