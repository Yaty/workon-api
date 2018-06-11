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
  getAccountsInProject,
  getAccountRolesInProject,
  getProjectDirectors,
  createRole,
  addAccountToProject,
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

  it('can create a project', async function() {
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
        const p = await getProject(account.id, res.body.id, account.token);
        expect(p).to.be.an('object');
        expect(p.id).to.equal(res.body.id);

        const accounts = await getAccountsInProject(
          account.id,
          res.body.id,
          account.token,
        );

        expect(accounts).to.be.an('array');
        expect(accounts).to.have.lengthOf(1);
        expect(accounts[0].id).to.equal(account.id);

        const accountRoles = await getAccountRolesInProject(
          account.id,
          res.body.id,
          account.token,
        );

        expect(accountRoles).to.be.an('array');
        expect(accountRoles).to.have.lengthOf(1);
        expect(accountRoles[0].name).to.equal('director');
        expect(accountRoles[0].projectId).to.equal(res.body.id);

        const directors = await getProjectDirectors(res.body.id, account.token);

        expect(directors).to.be.an('array');
        expect(directors).to.have.lengthOf(1);
        expect(directors[0].projectId).to.equal(res.body.id);
        expect(directors[0].name).to.equal('director');
        expect(directors[0].accounts).to.be.an('array');
        expect(directors[0].accounts[0].id).to.equal(account.id);
      });
  });

  it('can add workers to a project', async function() {
    const [director, account] = await accountFactory(2, {
      login: true,
    });

    const project = await createProject(0, director);

    return api.put(
      '/api/accounts/' + director.id +
      '/projects/' + project.id +
      '/accounts/rel/' + account.id
    )
      .set('Authorization', 'Bearer ' + director.token)
      .expect(200)
      .then(async function() {
        const p = await getProject(
          account.id,
          project.id,
          account.token,
        );

        expect(p).to.be.an('object');
        expect(p.id).to.equal(project.id);

        const accounts = await getAccountsInProject(
          account.id,
          project.id,
          account.token,
        );

        expect(accounts).to.be.an('array');
        expect(accounts)
          .to.satisfy(accounts => accounts.find(a => a.id === account.id));
      });
  });

  it('can add accounts to a project with an email', async function() {
    const [director, account] = await accountFactory(2, {
      login: true,
    });

    const project = await createProject(0, director);

    return api.put(
      '/api/accounts/' + director.id +
      '/projects/' + project.id +
      '/accounts/rel/' + account.email
    )
      .set('Authorization', 'Bearer ' + director.token)
      .expect(200)
      .then(async function() {
        const p = await getProject(
          account.id,
          project.id,
          account.token,
        );

        expect(p).to.be.an('object');
        expect(p.id).to.equal(project.id);

        const accounts = await getAccountsInProject(
          account.id,
          project.id,
          account.token,
        );

        expect(accounts).to.be.an('array');
        expect(accounts)
          .to.satisfy(accounts => accounts.find(a => a.id === account.id));
      });
  });

  it('can have roles chosen by the director of the project', async function() {
    const [director, account] = await accountFactory(2, {
      login: true,
    });

    const project = await createProject(0, director);
    const role = await createRole(project.id, director.id, director.token);
    await addAccountToProject(
      account.id,
      project.id,
      director.id,
      director.token,
    );

    return api.put(
      '/api/accounts/' + account.id +
      '/roles/rel/' + role.id
    )
      .set('Authorization', 'Bearer ' + director.token)
      .expect(200)
      .then(async () => {
        const roles = await getAccountRolesInProject(
          account.id,
          project.id,
          account.token
        );

        expect(roles).to.be.an('array');
        expect(roles).to.have.lengthOf(1);
        expect(roles[0].name).to.equal(role.name);
        expect(roles[0].id).to.equal(role.id);
        expect(roles[0].projectId).to.equal(project.id);
      });
  });

  it('can\'t set roles to himself inside a project', function() {
    throw new Error('todo');
  });

  it('can create tasks', function() {
    throw new Error('todo');
  });

  it('can create meetings', function() {
    throw new Error('todo');
  });

  it('can create steps', function() {
    throw new Error('todo');
  });

  it('can create topic', function() {
    throw new Error('todo');
  });

  it('can create work areas', function() {
    throw new Error('todo');
  });
});
