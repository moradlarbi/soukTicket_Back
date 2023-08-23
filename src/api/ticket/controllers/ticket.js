'use strict';

/**
 * ticket controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const qrcode = require('qrcode');
const jwt = require('jsonwebtoken');

module.exports = createCoreController('api::ticket.ticket', ({ strapi }) => ({
    async acheter(ctx) {
      const res = await strapi.db.transaction(async ({ trx, rollback, commit, onCommit, onRollback }) => {
      try {
        const user = ctx.state.user;
        const secret = process.env.QR_SECRET;
        
        // Construct the data you want to encode in the QR code
        const qrData = jwt.sign({ userId: user.id, ticketId: ctx.params.id }, secret);
        
        const response = await strapi.db.query("api::ticket.ticket").update({
          where: {
            id: ctx.params.id,
            user: null,
            state: 'in sale'
          },
          data: {
            user: user.id,
            state: 'purchased'
          }
        });
        
        // Generate the QR code image
        if(response != null) {
          qrcode.toDataURL(qrData, async (err, qrDataURL) => {
            if (err) {
              console.error('Error generating QR code:', err);
              await rollback()
              return err;
            }
            // Now you can send the email with the QR code URL
            await strapi.plugin('email').service('email').send({
              from: process.env.EMAIL_SMTP_USER,
              to: user.email,
              subject: `Your Ticket #${ctx.params.id} QR Code`,
              text: `Here is your QR code:`,
              attachments: [
                {
                    filename: "qrcode.png",
                    content: qrDataURL.replace("data:image/png;base64,", ""),
                    encoding: "base64",
                },
              ],
            });
          });
        }
        
        await commit()
        return response
      } catch (err) {
        console.log(err)
        await rollback()
        return err
      }})
      return res
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
