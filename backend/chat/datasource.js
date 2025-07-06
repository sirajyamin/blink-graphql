const MessageModel = require("./model");
const User = require("../user/model");
const { default: mongoose } = require("mongoose");

const getUserConversations = async (args) => {
  try {
    const user = new mongoose.Types.ObjectId(args.user);

    // Find all messages of this user
    const messages = await MessageModel.find({
      $or: [{ sender: user }, { recipient: user }],
    });

    // Generate random conversationId if missing
    await Promise.all(
      messages.map(async (msg) => {
        if (!msg.conversationId) {
          const randomId = Math.random().toString(36).substring(2, 12);
          const userA = msg.sender.toString();
          const userB = msg.recipient.toString();
          const sortedUsers = [userA, userB].sort();
          const conversationId = `${randomId}-${sortedUsers[0]}-${sortedUsers[1]}`;

          msg.conversationId = conversationId;
          await msg.save();
        }
      })
    );

    // Aggregate conversations
    const conversationsThreads = await MessageModel.aggregate([
      {
        $match: {
          $or: [{ sender: user }, { recipient: user }],
        },
      },
      {
        $group: {
          _id: "$conversationId",
          otherUser: {
            $first: {
              $cond: [{ $eq: ["$sender", user] }, "$recipient", "$sender"],
            },
          },
          lastMessage: { $last: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$recipient", user] },
                    { $ne: ["$status", "seen"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { "lastMessage.createdAt": -1 } },
    ]);

    const conversations = await Promise.all(
      conversationsThreads.map(async (thread) => {
        const participant = await User.findById(thread.otherUser).select(
          "first_name last_name email profile_logo online lastSeen"
        );

        return {
          conversationId: thread._id,
          participant: JSON.parse(JSON.stringify(participant)),
          lastMessage: JSON.parse(JSON.stringify(thread.lastMessage)),
          unreadCount: thread.unreadCount,
        };
      })
    );

    return {
      success: true,
      message: "Conversations retrieved successfully",
      statusCode: 200,
      data: conversations,
    };
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch conversations",
      data: null,
    };
  }
};

const getChatMessages = async (args) => {
  const { filters = {} } = args;
  const { user, conversationId } = filters;

  try {
    const query = {};
    if (user) query.$or = [{ sender: user }, { recipient: user }];
    if (conversationId) query.conversationId = conversationId;

    const messages = await MessageModel.find(query)
      .sort({ createdAt: 1 })
      .populate("sender recipient", "first_name last_name email");

    const enhancedMessage = messages.map((message) => {
      const isSender = user && message.sender._id.toString() === user;
      return {
        ...message.toObject(),
        direction: isSender ? "outgoing" : "incoming",
        isCurrentUser: isSender,
      };
    });

    return {
      success: true,
      message: messages.length
        ? "Messages retrieved successfully"
        : "No messages found",
      data: enhancedMessage,
    };
  } catch (error) {
    console.error("Error fetching messages:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch messages",
      messages: null,
    };
  }
};

module.exports.ChatService = {
  getUserConversations,
  getChatMessages,
};
