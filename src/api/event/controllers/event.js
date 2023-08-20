'use strict';

/**
 * event controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::event.event', {
    async create(ctx) {
        const res = await strapi.db.transaction(async ({ trx, rollback, commit, onCommit, onRollback }) => {
            try {
                const user = ctx.state.user;
                //let body = JSON.parse(ctx.request.body.data);
                let body = ctx.request.body.data;
                const tickets = body.tickets;
                delete ctx.request.body.data.tickets
                delete body.tickets
                body = { ...body, user: user.id }
                ctx.request.body = { ...ctx.request.body, data: body }
                
                const response = await super.create(ctx);
                console.log(response);
                
                for (let i = 0; i < tickets.length; i++) {
                    for (let j = 0; j < tickets[i].numberOfTickets; j++) {
                        await strapi.db.query('api::ticket.ticket').create({data: {
                            name: tickets[i].name,
                            price: tickets[i].price,
                            startDate: tickets[i].startDate,
                            endDate: tickets[i].endDate,
                            slug: tickets[i].slug,
                            event: response.data.id,
                            publishedAt: new Date()
                        }});
                    }
                }

                await commit()
                return response;
            } catch (error) {
                console.error(error);
                await rollback()
                throw new Error("Failed to create the resource.", error);
            }
        });
        return res;
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

