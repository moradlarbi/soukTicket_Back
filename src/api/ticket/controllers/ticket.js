'use strict';

/**
 * ticket controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const qrcode = require('qrcode');
const jwt = require('jsonwebtoken');

module.exports = createCoreController('api::ticket.ticket', ({ strapi }) => ({
  async acheter(ctx) {
    const requestBody = ctx.request.body; // Assuming the request body is an array of objects
  
    const res = await strapi.db.transaction(async ({ trx, rollback, commit }) => {
      try {
        const user = ctx.state.user;
        const secret = process.env.QR_SECRET;
        const ticketIds = []; // To store the IDs of processed tickets
  
        for (const criteria of requestBody) {
          console.log(criteria.event);
          // Find tickets that match the specified criteria
          const tickets = await strapi.entityService.findMany("api::ticket.ticket", {
            filters: {
              $and: [
                  {
                    event: {
                      id: {
                        $eq: criteria.event
                      }
                    }
                  }
              ],
              name: criteria.name,
              price: criteria.price,
              state: 'in sale',
            },
            limit: criteria.numberOfTickets, // Limit the number of tickets to process
          });
  
          for (const ticket of tickets) {
            console.log(ticket);
            const qrData = jwt.sign({ userId: user.id, ticketId: ticket.id }, secret);
  
            // Update the ticket and set the user as the purchaser
            const response = await strapi.db.query("api::ticket.ticket").update({
              where: { 
                id: ticket.id,
                state: 'in sale'
              },
              data: {
                user: user.id,
                state: 'purchased',
              },
            });
  
            if (response != null) {
              // Generate the QR code image
              const qrDataURL = await new Promise((resolve, reject) => {
                qrcode.toDataURL(qrData, (err, url) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(url);
                  }
                });
              });
  
              // Send an email with the QR code for this ticket
              await strapi.plugin('email').service('email').send({
                from: process.env.EMAIL_SMTP_USER,
                to: user.email,
                subject: `Your Ticket #${ticket.id} QR Code`,
                text: `Here is your QR code for Ticket #${ticket.id}:`,
                attachments: [
                  {
                    filename: `qrcode_${ticket.id}.png`,
                    content: qrDataURL.replace("data:image/png;base64,", ""),
                    encoding: "base64",
                  },
                ],
              });
  
              ticketIds.push(ticket.id); // Store the processed ticket ID
            }
          }
        }
  
        await commit();
        return ticketIds; // Return the IDs of processed tickets
      } catch (err) {
        console.log(err);
        await rollback();
        return err;
      }
    });
  
    return res;
  },
  async check(ctx) {
      const decoded = jwt.verify(ctx.params.qrcode, process.env.QR_SECRET);
      console.log(decoded);

      // Extract userId and paramsId from the decoded payload
      const { userId, ticketId } = decoded;
      
      const response = await strapi.db.query("api::ticket.ticket").update({
        where: {
          id: ticketId,
          user: userId,
          startDate: {
            $lte: new Date()
          },
          endDate: {
            $gte: new Date()
          },
          state: 'purchased',
        },
        data: {
          state: 'expired'
        }
      });

      return response
    }
  }));
