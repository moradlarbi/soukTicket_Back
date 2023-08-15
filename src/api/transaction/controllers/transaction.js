'use strict';

/**
 * transaction controller
 */


const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::transaction.transaction', {
    async create(ctx) {
        try {

            const user = ctx.state.user;
            console.log(user)
            const body = ctx.request.body.data;
            console.log(body.ticket);
            const ticket = body.ticket;

            const ticketRes = await strapi.entityService.findOne('api::ticket.ticket', ticket)
            console.log("ticketRes", ticketRes);
            if (!ticketRes) return { message: "ticket not found" }
            if (body.quantite > ticketRes.quantity) return { message: "quantité insuffisante" }

            if (body.quantite <= 0) return { message: "quantité insuffisante" }

            const updateTicket = await strapi.entityService.update('api::ticket.ticket', ticket, {
                data: {
                    quantity: ticketRes.quantity - body.quantite
                }
            })
            if (!updateTicket) return { message: "ticket not found" }


            ctx.request.body.data.user = user.id


            const response = await super.create(ctx);
            return response;
        } catch (error) {
            console.error(error);
            throw new Error("Failed to create the resource.", error);
        }
    },
    async find(ctx) {

        const user = ctx.state.user;
        console.log(user)


        if (user.role.type === "authenticated") {
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

