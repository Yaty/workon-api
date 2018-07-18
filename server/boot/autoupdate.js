'use strict';

module.exports = function enableAuthentication(server, cb) {
  const ds = server.dataSources.mysql;

  const models = [
    'ACL',
    'AccessToken',
    'Account',
    'Role',
    'Conversation',
    'Meeting',
    'Step',
    'AccountBug',
    'Bug',
    'Task',
    'Message',
    'Project',
    'ProjectRole',
    'AccountProject',
    'AccountProjectRole',
    'ConversationAccount',
  ];

  ds.setMaxListeners(Infinity);

  ds.autoupdate(models, function(err) {
    if (err) return cb(err);
    console.log('Tables [' + models + '] created in ', ds.adapter.name);
    cb();
  });
};
