
'use strict';

const api = require('../api');
const {expect} = require('chai');
const {uuid, accountFactory, createProject, getProject} = require('../utils');

describe('Project creation', function() {
  let project;

  beforeEach(async function() {
    const [director] = await accountFactory(1);

    project = {
      name: uuid(),
      directorId: director.id,
    };
  });

  describe('ACL', function() {
  });

  it('create a project', function(done) {
    api.post('/api/projects')
      .send(project)
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        expect(res.body).to.be.an('object');

        for (const [key, value] of Object.entries(project)) {
          expect(res.body[key]).to.be.equal(value);
        }

        expect(res.body).to.have.property('id');

        done();
      });
  });

  it('create a project with workers', async function() {
    const {id} = await createProject();
    const [worker] = await accountFactory(1);

    return api.put('/api/projects/' + id + '/workers/rel/' + worker.id)
      .expect(200)
      .then(async () => {
        const project = await getProject(id);
        expect(project.workers[0].id).to.be.equal(worker.id);
      });
  });
});
