const Conversations = require("../models/conversationModel");
const Messages = require("../models/messageModel");
const mongoose = require("mongoose");


function getLastReadMessageId(conversation, userId) {
  try {
    return conversation.lastReadMessage && conversation.lastReadMessage[userId]
      ? new mongoose.Types.ObjectId(conversation.lastReadMessage[userId])
      : new mongoose.Types.ObjectId(0);
  } catch (error) {
    console.error("Error parsing lastReadMessageId:", error);
    return new mongoose.Types.ObjectId(0);
  }
}


async function getUnreadCount(conversationId, lastReadMessageId, userId) {
  try {
    return await Messages.countDocuments({
      conversationId,
      _id: { $gt: lastReadMessageId },
      from: { $ne: userId },
    });
  } catch (error) {
    console.error("Error counting unread messages:", error);
    return 0;
  }
}


function sortConversations(conversations) {
  return conversations.sort((a, b) => {
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
    return b.updatedAt - a.updatedAt;
  });
}

async function createConversation(users) {
  let conversation = await Conversations.findOne({
    users: { $all: users, $size: users.length },
  });

  if (!conversation) {
    conversation = await Conversations.create({ users });
  }

  conversation = await conversation.populate("users");
  return { status: true, ...conversation._doc };
}


async function getAllConversations(userId, searchName) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const basePipeline = [
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

  const searchPipeline = searchName?.trim()
    ? [
        {
          $match: {
            userDetails: {
              $elemMatch: {
                fullName: { $regex: searchName.trim(), $options: "i" },
                _id: { $ne: new mongoose.Types.ObjectId(userId) },
              },
            },
          },
        },
      ]
    : [{ $sort: { updatedAt: -1 } }];

  const pipeline = [...basePipeline, ...searchPipeline];
  const conversations = await Conversations.aggregate(pipeline);

  const conversationsWithUnreadCount = await Promise.all(
    conversations.map(async (conversation) => {
      const lastReadMessageId = getLastReadMessageId(conversation, userId);
      const unreadCount = await getUnreadCount(
        conversation._id,
        lastReadMessageId,
        userId
      );

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

  return sortConversations(conversationsWithUnreadCount);
}


async function markConversationAsRead(userId, conversationId) {
  const lastMessage = await Messages.findOne({ conversationId }).sort({
    createdAt: -1,
  });

  if (lastMessage) {
    await Conversations.findByIdAndUpdate(conversationId, {
      $set: { [`lastReadMessage.${userId}`]: lastMessage._id },
    });
  }

  return { status: true, message: "Conversation marked as read" };
}


async function deleteConversation(conversationId) {
  const deletedConversation = await Conversations.findByIdAndDelete(
    conversationId
  );

  if (!deletedConversation) {
    throw new Error("Conversation not found");
  }

  await Messages.deleteMany({ conversationId });

  return {
    status: true,
    message: "Conversation and associated messages deleted successfully",
  };
}

module.exports = {
  createConversation,
  getAllConversations,
  markConversationAsRead,
  deleteConversation,
};

// // services/conversationService.js
// const Conversations = require("../models/conversationModel");
// const Messages = require("../models/messageModel");
// const mongoose = require("mongoose");
// const { getIoInstance } = require("../socket");

// // Helper functions
// const getLastReadMessageId = (conversation, userId) => {
//   try {
//     return conversation.lastReadMessage && conversation.lastReadMessage[userId]
//       ? new mongoose.Types.ObjectId(conversation.lastReadMessage[userId])
//       : new mongoose.Types.ObjectId(0);
//   } catch (error) {
//     console.error("Error parsing lastReadMessageId:", error);
//     return new mongoose.Types.ObjectId(0);
//   }
// };

// const getUnreadCount = async (conversationId, lastReadMessageId, userId) => {
//   try {
//     return await Messages.countDocuments({
//       conversationId,
//       _id: { $gt: lastReadMessageId },
//       from: { $ne: userId },
//     });
//   } catch (error) {
//     console.error("Error counting unread messages:", error);
//     return 0;
//   }
// };

// const sortConversations = (conversations) => {
//   return conversations.sort((a, b) => {
//     if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
//     if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
//     return b.updatedAt - a.updatedAt;
//   });
// };

// // Service functions
// const createConversationService = async (users) => {
//   let conversation = await Conversations.findOne({
//     users: { $all: users, $size: users.length },
//   });

//   if (!conversation) {
//     conversation = await Conversations.create({ users });
//   }

//   conversation = await conversation.populate("users");
//   const result = { status: true, ...conversation._doc };

//   //   const io = getIoInstance();
//   //   io.emit("new-conversation", result);

//   return result;
// };

// const getAllConversationsService = async (userId, searchName) => {
//   if (!userId) {
//     throw new Error("User ID is required");
//   }

//   const basePipeline = [
//     { $match: { users: new mongoose.Types.ObjectId(userId) } },
//     {
//       $lookup: {
//         from: "users",
//         localField: "users",
//         foreignField: "_id",
//         as: "userDetails",
//       },
//     },
//     {
//       $project: {
//         users: 1,
//         userDetails: 1,
//         lastReadMessage: 1,
//         createdAt: 1,
//         updatedAt: 1,
//       },
//     },
//   ];

//   const searchPipeline = searchName?.trim()
//     ? [
//         {
//           $match: {
//             userDetails: {
//               $elemMatch: {
//                 fullName: { $regex: searchName.trim(), $options: "i" },
//                 _id: { $ne: new mongoose.Types.ObjectId(userId) },
//               },
//             },
//           },
//         },
//       ]
//     : [{ $sort: { updatedAt: -1 } }];

//   const pipeline = [...basePipeline, ...searchPipeline];
//   const conversations = await Conversations.aggregate(pipeline);

//   const conversationsWithUnreadCount = await Promise.all(
//     conversations.map(async (conversation) => {
//       const lastReadMessageId = getLastReadMessageId(conversation, userId);
//       const unreadCount = await getUnreadCount(
//         conversation._id,
//         lastReadMessageId,
//         userId
//       );

//       const filteredUsers = conversation.userDetails.filter(
//         (user) => user._id.toString() !== userId
//       );

//       return {
//         ...conversation,
//         users: filteredUsers,
//         unreadCount,
//       };
//     })
//   );

//   return sortConversations(conversationsWithUnreadCount);
// };

// const markConversationAsReadService = async (userId, conversationId) => {
//   const lastMessage = await Messages.findOne({ conversationId }).sort({
//     createdAt: -1,
//   });

//   if (lastMessage) {
//     await Conversations.findByIdAndUpdate(conversationId, {
//       $set: { [`lastReadMessage.${userId}`]: lastMessage._id },
//     });
//   }

//   return { status: true, message: "Conversation marked as read" };
// };

// const deleteConversationService = async (conversationId) => {
//   const deletedConversation = await Conversations.findByIdAndDelete(
//     conversationId
//   );

//   if (!deletedConversation) {
//     throw new Error("Conversation not found");
//   }

//   await Messages.deleteMany({ conversationId });

//   //   const io = getIoInstance();
//   //   io.emit("conversation-deleted", { conversationId });

//   return {
//     status: true,
//     message: "Conversation and associated messages deleted successfully",
//   };
// };

// module.exports = {
//   createConversationService,
//   getAllConversationsService,
//   markConversationAsReadService,
//   deleteConversationService,
// };
