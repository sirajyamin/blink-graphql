const { ApolloServer } = require("@apollo/server");
const dbConnect = require("./dbConnect");
const schema = require("./graphqlSchema");

const createApolloGraphqlServer = async () => {
  const gqlServer = new ApolloServer(schema);

  await gqlServer.start();
  return gqlServer;
};

const context = {
  context: async ({ req, res }) => {
    await dbConnect();

    return {
      req,
      res,
      user: req.user,
    };
  },
};

module.exports = { createApolloGraphqlServer, context };
