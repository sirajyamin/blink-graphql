const typedefs = `
  type Offer {
    amount: Float
    status: String
    counterOffer: Float
    terms: String
  }

  type Message {
    _id: ID
    sender: User
    recipient: User
    content: String
    offer: Offer
    
    type: String
    status: String
    conversationId: String
    createdAt: String
    direction: String
    isCurrentUser: Boolean
  }

  type Conversation {
    conversationId: String
    participant: User
    lastMessage: Message
    unreadCount: Int
  }

  type GetUserConversationsResponse {
    success: Boolean
    message: String
    data: [Conversation]
  }

  type GetChatMessagesResponse {
    success: Boolean
    message: String
    data: [Message]
  }

  input MessageFilterInput {
    user: ID
    conversationId: String
  }

 
`;

module.exports.typedefs = typedefs;
