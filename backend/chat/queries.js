const queries = `#graphql

getChatMessages(filters: MessageFilterInput): GetChatMessagesResponse
getUserConversations(user: String!): GetUserConversationsResponse


`;

module.exports.queries = queries;
