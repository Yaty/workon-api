'use strict';

module.exports = function enableAuthentication(server) {
  const ds = server.dataSources.mysql;

  const models = [
    'Account',
    'Role',
    'Meeting',
    'Step',
    'WorkArea',
    'Task',
    'Topic',
    'Message',
    'Project',
    'ProjectRole',
    'Thread',
    'ThreadAccount',
    'AccountProject',
    'AccountProjectRole',
  ];

  ds.autoupdate(models, function(err) {
    if (err) throw err;
    console.log('Tables [' + models + '] created in ', ds.adapter.name);
  });
};
