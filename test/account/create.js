'use strict';

const api = require('../api');
const {expect} = require('chai');
const {
  uuid,
  isValidValidationError,
  accountFactory,
  getCollaborator,
  createThread,
  getMessage,
  getThread,
  getProject,
  createProject,
} = require('../utils');

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

  it('can have collaborators', async function() {
    const [account, collaborator] = await accountFactory(2, {
      login: true,
    });

    return api.put(
      '/api/accounts/' + account.id +
      '/collaborators/rel/' + collaborator.id
    )
      .set('Authorization', 'Bearer ' + account.token)
      .expect(200)
      .then(async function() {
        const c = await getCollaborator(
          account.id,
          collaborator.id,
          account.token
        );

        expect(c).to.be.an('object');
        expect(c.id).to.equal(collaborator.id);
      });
  });

  it('can have messages', async function() {
    const [account] = await accountFactory(1, {
      login: true,
    });
    const thread = await createThread(account.id, account.token);

    return api.post('/api/accounts/' + account.id + '/messages')
      .set('Authorization', 'Bearer ' + account.token)
      .send({
        content: String(Math.random()),
        threadId: thread.id,
      })
      .expect(200)
      .then(async function(res) {
        const m = await getMessage(account.id, res.body.id, account.token);
        expect(m).to.be.an('object');
        expect(m.id).to.equal(res.body.id);
        expect(m.accountId).to.equal(account.id);
        expect(m.threadId).to.equal(thread.id);
        expect(m.content).to.be.an('string');
      });
  });

  it('can have threads', async function() {
    const [account] = await accountFactory(1, {
      login: true,
    });

    return api.post('/api/accounts/' + account.id + '/threads')
      .set('Authorization', 'Bearer ' + account.token)
      .send({
        name: String(Math.random()),
      })
      .expect(200)
      .then(async function(res) {
        const t = await getThread(account.id, res.body.id, account.token);
        expect(t).to.be.an('object');
        expect(t.id).to.equal(res.body.id);
        expect(t.name).to.be.an('string');
      });
  });

  it('can create projects', async function() {
    const [account] = await accountFactory(1, {
      login: true,
    });

    return api.post('/api/accounts/' + account.id + '/projects')
      .set('Authorization', 'Bearer ' + account.token)
      .send({
        name: String(Math.random()),
      })
      .expect(200)
      .then(async function(res) {
        const p = await getProject(res.body.id, account.token);
        expect(p).to.be.an('object');
        expect(p.id).to.equal(res.body.id);
      });
  });

  it('can add workers to a project', async function() {
    const [director, account] = await accountFactory(2, {
      login: true,
    });

    const project = await createProject({
      name: String(Math.random()),
    }, director.id);

    return api.put('/api/projects/' + project.id + '/workers/rel/' + account.id)
      .set('Authorization', 'Bearer ' + account.token)
      .expect(200)
      .then(async function() {
        const p = await getProject(project.id);
        expect(p).to.be.an('object');
        expect(p.id).to.equal(project.id);
        expect(p.directorId).to.equal(director.id);
        expect(p.workers).to.be.an('array');
        expect(p.workers)
          .to.satisfy(workers => workers.find(w => w.id === account.id));
      });
  });
});
