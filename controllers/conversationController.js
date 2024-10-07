const Conversations = require("../models/conversationModel");
const Messages = require("../models/messageModel");
const mongoose = require("mongoose");
const { getIoInstance } = require("../socket");

module.exports.createConversation = async (req, res, next) => {
  try {
    const { users } = req.body;

    let conversation = await Conversations.findOne({
      users: { $all: users, $size: users.length },
    });

    if (!conversation) {
      conversation = await Conversations.create({ users });
    }
    conversation = await conversation.populate("users");
    const result = { status: true, ...conversation._doc };
    const io = getIoInstance();
    io.emit("new-conversation", result);
    return res.json(result);
  } catch (ex) {
    next(ex);
  }
};

// module.exports.getAllConversation = async (req, res, next) => {
//   try {
//     const userId = req.params.id;
//     const conversations = await Conversations.find({
//       users: userId,
//     }).populate("users");

//     const conversationsWithUnreadCount = await Promise.all(conversations.map(async (conversation) => {
//       const lastReadMessageId = conversation.lastReadMessage.get(userId);
//       const unreadCount = await Messages.countDocuments({
//         conversationId: conversation._id,
//         _id: { $gt: lastReadMessageId || new mongoose.Types.ObjectId(0) },
//         from: { $ne: userId }
//       });

//       // Filter out the user that matches userId
//       const filteredUsers = conversation.users.filter(user => user._id.toString() !== userId);

//       // Determine whether to return an object or an array
//       // const usersData = filteredUsers.length === 1 ? filteredUsers[0] : filteredUsers;

//       return {
//         ...conversation._doc,
//         users: filteredUsers,
//         unreadCount
//       };
//     }));

//     return res.json(conversationsWithUnreadCount);
//   } catch (ex) {
//     next(ex);
//   }
// };

module.exports.getAllConversation = async (req, res, next) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return;
    }
    const { searchName } = req.query; // Get searchName from query

    // Base aggregation pipeline
    let pipeline = [
      { $match: { users: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "users",
          localField: "users",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $project: {
          users: 1,
          userDetails: 1,
          lastReadMessage: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ];

    // If searchName is provided, add a $match stage to filter by name
    if (searchName && searchName.trim() !== "") {
      pipeline.push({
        $match: {
          userDetails: {
            $elemMatch: {
              fullName: { $regex: searchName.trim(), $options: "i" },
              _id: { $ne: new mongoose.Types.ObjectId(userId) },
            },
          },
        },
      });
    } else {
      // If no search is being performed, add a sorting stage
      pipeline.push({ $sort: { updatedAt: -1 } });
    }

    // Execute the aggregation pipeline
    const conversations = await Conversations.aggregate(pipeline);

    const conversationsWithUnreadCount = await Promise.all(
      conversations.map(async (conversation) => {
        let lastReadMessageId;
        try {
          lastReadMessageId =
            conversation.lastReadMessage && conversation.lastReadMessage[userId]
              ? new mongoose.Types.ObjectId(
                  conversation.lastReadMessage[userId]
                )
              : new mongoose.Types.ObjectId(0);
        } catch (error) {
          console.error("Error parsing lastReadMessageId:", error);
          lastReadMessageId = new mongoose.Types.ObjectId(0);
        }

        let unreadCount = 0;
        try {
          unreadCount = await Messages.countDocuments({
            conversationId: conversation._id,
            _id: { $gt: lastReadMessageId },
            from: { $ne: userId },
          });
        } catch (error) {
          console.error("Error counting unread messages:", error);
        }

        // Filter out the current user and format user details
        const filteredUsers = conversation.userDetails.filter(
          (user) => user._id.toString() !== userId
        );

        return {
          ...conversation,
          users: filteredUsers,
          unreadCount,
        };
      })
    );

    // Sort conversations: unread first, then by updatedAt
    const sortedConversations = conversationsWithUnreadCount.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      return b.updatedAt - a.updatedAt;
    });

    return res.json(sortedConversations);
  } catch (ex) {
    console.error("Error in getAllConversation:", ex);
    next(ex);
  }
};

module.exports.markConversationAsRead = async (req, res, next) => {
  try {
    const { userId, conversationId } = req.params;

    const lastMessage = await Messages.findOne({ conversationId }).sort({
      createdAt: -1,
    });

    if (lastMessage) {
      await Conversations.findByIdAndUpdate(conversationId, {
        $set: { [`lastReadMessage.${userId}`]: lastMessage._id },
      });
    }

    res.json({ status: true, message: "Conversation marked as read" });
  } catch (ex) {
    next(ex);
  }
};

module.exports.deleteConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    // Delete the conversation
    const deletedConversation = await Conversations.findByIdAndDelete(
      conversationId
    );

    if (!deletedConversation) {
      return res
        .status(404)
        .json({ status: false, message: "Conversation not found" });
    }

    // Delete all messages associated with the conversation
    await Messages.deleteMany({ conversationId });

    // Emit a socket event to notify clients about the deleted conversation
    const io = getIoInstance();
    io.emit("conversation-deleted", { conversationId });

    res.json({
      status: true,
      message: "Conversation and associated messages deleted successfully",
    });
  } catch (ex) {
    next(ex);
  }
};
