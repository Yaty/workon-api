'use strict';

module.exports = function enableAuthentication(server) {
  const ds = server.dataSources.mysql;

  const models = [
    'ACL',
    'AccessToken',
    'Account',
    'Role',
    'Conversation',
    'Meeting',
    'Step',
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
    if (err) throw err;
    console.log('Tables [' + models + '] created in ', ds.adapter.name);
  });
};
