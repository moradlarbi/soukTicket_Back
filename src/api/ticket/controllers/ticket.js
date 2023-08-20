'use strict';

/**
 * ticket controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::ticket.ticket', ({ strapi }) => ({
    async acheter(ctx) {
      const entries = await strapi.db.query("api::hello.hello").findMany();
  
      ctx.body = entries;
    },
  }));
