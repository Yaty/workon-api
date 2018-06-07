'use strict';

const api = require('../api');
const {expect} = require('chai');
const {
  accountFactory,
  createProject,
  createRole,
  getAssociateRole,
} = require('../utils');

describe('Associate', function() {
  it('can have roles chosen by the director of the project', async function() {
    const [director, account] = await accountFactory(2, {
      login: true,
    });
    const project = await createProject(undefined, director.id, [account.id]);
    const role = await createRole(project.id, director.token);

    console.log(project, role);

    const associateId = project.workers.find((w) => w.accountId === account.id);

    return api.put('/api/associates/' + associateId + '/roles/rel/' + role.id)
      .set('Authorization', 'Bearer ' + director.token)
      .expect(200)
      .then(async (res) => {
        const ar = await getAssociateRole(associateId, role.id, account.token);
        expect(ar).to.be.an('object');
        expect(ar.name).to.equal(role.name);
        expect(ar.id).to.equal(role.id);
        expect(ar.projectId).to.equal(project.id);
      });
  });

  it('can\'t set roles to himself inside a project', function() {

  });

  it('it can have tasks', function() {

  });

  it('it can have meetings', function() {

  });
});
