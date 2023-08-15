'use strict';

/**
 * event controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::event.event', {
    async create(ctx) {
        try {

            const user = ctx.state.user;
            let body = JSON.parse(ctx.request.body.data);
            //console.log(JSON.parse(ctx.request.body.data));
            console.log(body);
            body = { ...body, user: user.id }
            console.log(body);

            ctx.request.body = { ...ctx.request.body, data: JSON.stringify(body) }
            console.log("body", ctx.request.body)
            const response = await super.create(ctx);
            return response;
        } catch (error) {
            console.error(error);
            throw new Error("Failed to create the resource.", error);
        }
    },
    async find(ctx) {

        const user = ctx.state.user;
        if (!user)
            return await super.find(ctx);

        else if (user.role.type === "organizer") {
            ctx.query.filters = {
                ...(ctx.query.filters || {}),
                user: user.id
            };

            const response = await super.find(ctx);
            return response;
        } else {

            const response = await super.find(ctx);
            return response
        }

    },


});

