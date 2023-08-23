module.exports = {
    routes: [
      {
        method: "PUT",
        path: "/acheter-ticket/:id",
        handler: "ticket.acheter",
      },
    ],
  };