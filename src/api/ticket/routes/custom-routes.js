module.exports = {
    routes: [
      {
        method: "PUT",
        path: "/acheter-ticket",
        handler: "ticket.acheter",
      },
      {
        method: "PUT",
        path: "/check/:qrcode",
        handler: "ticket.check",
      },
    ],
  };