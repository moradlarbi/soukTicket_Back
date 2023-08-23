'use strict';

/**
 * ticket controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const qrcode = require('qrcode');

module.exports = createCoreController('api::ticket.ticket', ({ strapi }) => ({
    async acheter(ctx) {
      const user = ctx.state.user;
      const secret = process.env.QR_SECRET;
      
      console.log(user);
      
      // Construct the data you want to encode in the QR code
      const qrData = `${user.id}${secret}${ctx.params.id}`;
      console.log(qrData);
      const response = await strapi.db.query("api::ticket.ticket").update({
        where: {
          id: ctx.params.id,
          state: 'in sale'
        },
        data: {
          user: user.id,
          state: 'purchased'
        }
      });

    // Generate the QR code image
      qrcode.toDataURL(qrData, async (err, qrDataURL) => {
        if (err) {
          console.error('Error generating QR code:', err);
          return;
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

      return response
    },
    async check(ctx) {
      const [userId, paramsId] = ctx.params.qrcode.split(process.env.QR_SECRET);
      const response = await strapi.db.query("api::ticket.ticket").update({
        where: {
          id: paramsId,
          user: userId,
          state: 'purchased'
        },
        data: {
          state: 'expired'
        }
      });
      return response
    }
  }));
