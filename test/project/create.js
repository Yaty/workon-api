
'use strict';

const api = require('../api');
const {expect} = require('chai');
const {uuid, accountFactory} = require('../utils');

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

  it('create a project with workers', function(done) {
    let projectId;
    api.post('/api/projects')
      .send(project)
      .expect(200)
      .end(async function(err, res) {
        if (err) return done(err);
        const [worker] = await accountFactory(1);
        projectId = res.body.id;
        api.put('/api/projects/' + projectId + '/workers/rel/' + worker.id)
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            api.get('/api/projects/' + projectId + '/workers')
              .expect(200)
              .end((err, res) => {
                if (err) return done(err);
                expect(res.body).to.be.an('array');
                expect(res.body[0].id).to.be.equal(worker.id);
                done();
              });
          });
      });
  });
});
