
'use strict';

const api = require('../api');
const {expect} = require('chai');
const {
  uuid,
  accountFactory,
  createProject,
  getProject,
  getAssociates,
  getRoles,
} = require('../utils');

describe('Project creation', function() {
  describe('ACL', function() {
  });

  it('create a project', async function() {
    const [director] = await accountFactory(1, {
      login: true,
    });

    const project = {
      name: uuid(),
    };

    return api.post('/api/projects')
      .set('Authorization', 'Bearer ' + director.token)
      .send(project)
      .expect(200)
      .then(function(res) {
        expect(res.body).to.be.an('object');

        for (const [key, value] of Object.entries(project)) {
          expect(res.body[key]).to.be.equal(value);
        }

        expect(res.body).to.have.property('id');
      });
  });

  it('create a project with workers', async function() {
    const [director, worker] = await accountFactory(2, {
      login: true,
    });

    const {id} = await createProject();


    return api.put('/api/projects/' + id + '/workers/rel/' + worker.id)
      .expect(200)
      .then(async () => {
        const project = await getProject(id);
        expect(project.workers[0].id).to.be.equal(worker.id);
      });
  });

  it('create the director role and assign it to the director', async () => {
    const [director] = await accountFactory(1, {
      login: true,
    });

    const project = {
      name: uuid(),
    };

    return api.post('/api/projects')
      .set('Authorization', 'Bearer ' + director.token)
      .send(project)
      .expect(200)
      .then(async function(res) {
        const associates = await getAssociates(res.body.id, director.token);
        expect(associates).to.be.an('array');
        expect(associates[0].id).to.equal(director.id);

        const roles = await getRoles(associates[0].associateId, director.token);
        expect(roles).to.be.an('array');
        expect(roles[0].name).to.equal('director');
      });
  });
});
