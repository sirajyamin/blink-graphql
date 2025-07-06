const { User } = require("./user");
const { Chat } = require("./chat");

const schema = {
  typeDefs: `#graphql
     
    ${User.typedefs} 
    ${Chat.typedefs}
    
    type Response {
      success: Boolean
      message: String 
    }

    type Query {
      ${User.queries} 
      ${Chat.queries}
    }

    type Mutation {
      ${User.mutations}
      ${Chat.mutations}
    }
    `,

  resolvers: {
    Query: {
      ...User.resolvers.queries,
      ...Chat.resolvers.queries,
    },
    Mutation: {
      ...User.resolvers.mutations,
      ...Chat.resolvers.mutations,
    },
  },
  introspection: true,
  formatError: (err) => ({
    message: err.message,
    success: false,
  }),
};

module.exports = schema;
