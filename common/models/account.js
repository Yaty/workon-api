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
    const userId = ctx.args.options &&
      ctx.args.options.accessToken &&
      ctx.args.options.accessToken.userId;
    const projectId = output.id;

    if (!userId || !projectId) throw errors.forbidden();

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
   * Create a container when a project is created
   */
  Account.afterRemote('prototype.__create__projects', (ctx, output, cb) => {
    const Container = Account.app.models.Container;

    Container.createContainer({
      name: String(output.id),
    }, (err) => {
      if (err) return cb(err);
      cb();
    });
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

  /**
   * Allow only directors to add roles
   */
  Account.beforeRemote('prototype.__link__roles', async (ctx) => {
    const accountId = ctx.instance && ctx.instance.id;
    const tokenAccountId = ctx.args.options &&
      ctx.args.options.accessToken &&
      ctx.args.options.accessToken.userId;
    const roleId = ctx.args.fk;

    if (!accountId || !tokenAccountId || !roleId) throw errors.forbidden();

    const tokenAccount = await Account.findById(tokenAccountId);
    if (!tokenAccount) throw errors.userNotFound();

    const role = await Account.app.models.ProjectRole.findById(roleId);
    if (!role) throw errors.roleNotFound();

    const projectId = String(role.projectId);

    // TODO : Make the filter inside the find (when not using MongoDB anymore)
    const tokenAccountRoles = (await tokenAccount.roles.find())
      .filter((r) => String(r.projectId) === String(projectId));

    const isDirector = tokenAccountRoles
      .map((r) => r.name)
      .includes('director');

    if (!isDirector) throw errors.forbidden();
  });

  /**
   * Add the creator id to the bug
   */
  Account.beforeRemote('prototype.__create__projects__bugs',
    async (ctx) => {
      const accountId = ctx.args.options &&
        ctx.args.options.accessToken &&
        ctx.args.options.accessToken.userId;

      if (!accountId) throw errors.forbidden();

      ctx.args.data.creatorId = accountId;
    });
};
