// services/messageService.js
const Messages = require("../models/messageModel");
const Conversations = require("../models/conversationModel");


async function getMessages(conversationId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  // Fetch messages with pagination and sort from newest to oldest
  const messages = await Messages.find({ conversationId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Reverse the array to display messages from oldest to newest
  const orderedMessages = messages.reverse();

  // Get the total count of messages for this conversation
  const totalCount = await Messages.countDocuments({ conversationId });

  return {
    messages: orderedMessages,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    hasMore: skip + orderedMessages.length < totalCount,
    lastMessageId: orderedMessages.length > 0 ? orderedMessages[orderedMessages.length - 1]._id : null
  };
}


async function updateLastReadMessage(conversationId, userId, messageId) {
  await Conversations.findByIdAndUpdate(conversationId, {
    $set: { [`lastReadMessage.${userId}`]: messageId }
  });
}

async function addMessage(messageData) {
  const { from, conversationId, message, type, files } = messageData;
  return await Messages.create({ from, conversationId, message, type, files });
}

module.exports = {
  getMessages,
  updateLastReadMessage,
  addMessage
};
