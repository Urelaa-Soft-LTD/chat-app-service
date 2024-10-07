const Messages = require("../models/messageModel");
const Conversations = require("../models/conversationModel");

module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, conversationId, page = 1, limit = 20 } = req.body;

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Fetch messages with pagination, sorted from newest to oldest
    const messages = await Messages.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Reverse the array to display messages from oldest to newest
    const orderedMessages = messages.reverse();

    // Get total count of messages for this conversation
    const totalCount = await Messages.countDocuments({ conversationId });

    if (orderedMessages.length > 0 && page === 1) {
      const lastMessageId = orderedMessages[orderedMessages.length - 1]._id;
      await Conversations.findByIdAndUpdate(conversationId, {
        $set: { [`lastReadMessage.${from}`]: lastMessageId }
      });
    }

    res.json({
      messages: orderedMessages,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: skip + orderedMessages.length < totalCount
    });
  } catch (ex) {
    next(ex);
  }
};

module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, conversationId, message, type, files } = req.body;
   
    const data = await Messages.create({
      from,
      conversationId,
      message,
      type,
      files
    });

    if (data) {
      // No need to update unread counts here, as they're calculated dynamically
      return res.json({ msg: "Message added successfully.", data });
    } else {
      return res.json({ msg: "Failed to add message to the database" });
    }
  } catch (ex) {
    next(ex);
  }
};

// module.exports.addMessage = async (req, res, next) => {
//   try {
//     const { from, conversationId, message, type, files } = req.body;
   
//     const data = await Messages.create({
//       from,
//       conversationId,
//       message,
//       type,
//       files
//     });

//     if (data) {
//       const conversation = await Conversations.findById(conversationId);
//       if (!conversation) {
//         return res.status(404).json({ msg: "Conversation not found" });
//       }

//       // Emit socket event for real-time updates
//       const io = getIoInstance();
//       conversation.users.forEach(userId => {
//         if (userId.toString() !== from) {
//           const receiverSocket = global.onlineUsers.get(userId.toString());
//           if (receiverSocket) {
//             io.to(receiverSocket).emit("msg-receive", data);
//             io.to(receiverSocket).emit("update-unread-count", {
//               conversationId: conversationId,
//             });
//           }
//         }
//       });

//       return res.json({ msg: "Message added successfully.", data });
//     } else {
//       return res.json({ msg: "Failed to add message to the database" });
//     }
//   } catch (ex) {
//     next(ex);
//   }
// };

