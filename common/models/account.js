'use strict';

module.exports = function(Account) {
  Account.on('attached', function() {
    Account.nestRemoting('projects');
  });

  Account.afterRemote('prototype.__create__projects', async (ctx, output) => {
    const userId = ctx.args.options.accessToken.userId;
    const projectId = output.id;

    // Create the director role
    const ProjectRole = Account.app.models.ProjectRole;
    const directorRole = await ProjectRole.create({
      projectId,
      name: 'director',
    });

    // Add the director role to the user who created the project
    await directorRole.accounts.add(userId);
  });
};
