'use strict';

module.exports = function enableAuthentication(server) {
  const ds = server.dataSources.db;

  const models = [
    'AccessToken',
    'Account',
    'AccountProject',
    'AccountProjectRole',
    'Message',
    'Project',
    'ProjectRole',
    'Thread',
    'ThreadAccount',
  ];

  ds.automigrate(models, function(err) {
    if (err) throw err;
    console.log('Tables [' + models + '] created in ', ds.adapter.name);
  });
};
