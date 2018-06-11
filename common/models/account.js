'use strict';

const regexp = require('../regexp');
const errors = require('../errors');

module.exports = function(Account) {
  /**
   * Add project CRUD into Account routes
   */
  Account.on('attached', function() {
    Account.nestRemoting('projects');
  });

  /**
   * Affect the director role to the Account that created the project
   */
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

  /**
   * Allow to link an account to a project with an email
   */
  Account.beforeRemote('prototype.__link__projects__accounts', async (ctx) => {
    const accountPk = ctx.args.fk;

    if (regexp.email.test(accountPk)) {
      const account = await Account.findOne({
        where: {
          email: accountPk,
        },
      });

      if (!account) throw errors.userNotFound();

      ctx.args.fk = account.id;
    }
  });
};
