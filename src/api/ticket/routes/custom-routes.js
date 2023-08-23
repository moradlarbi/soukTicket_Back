module.exports = {
    routes: [
      {
        method: "PUT",
        path: "/acheter-ticket/:id",
        handler: "ticket.acheter",
      },
      {
        method: "PUT",
        path: "/check/:qrcode",
        handler: "ticket.check",
      },
    ],
  };