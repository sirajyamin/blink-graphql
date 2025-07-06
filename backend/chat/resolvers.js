const { ChatService } = require("./datasource");

const queries = {
  getChatMessages: async (parent, args, context, info) => {
    try {
      return await ChatService.getChatMessages(args);
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  },

  getUserConversations: async (parent, args, context, info) => {
    try {
      return await ChatService.getUserConversations(args);
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: error.message || "Failed to fetch conversations",
        conversations: null,
      };
    }
  },
};

const mutations = {};

module.exports.resolvers = { queries, mutations };
