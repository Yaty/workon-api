'use strict';

const regexp = require('../regexp');
const errors = require('../errors');

module.exports = function(Conversation) {
  /**
   * Allow to link an account to a conversation with an email
   */
  Conversation.beforeRemote('prototype.__link__accounts', async (ctx) => {
    const accountPk = ctx.args.fk;

    if (regexp.email.test(accountPk)) {
      const account = await Conversation.app.models.Account.findOne({
        where: {
          email: accountPk,
        },
      });

      if (!account) throw errors.userNotFound();

      ctx.args.fk = account.id;
    }
  });
};
