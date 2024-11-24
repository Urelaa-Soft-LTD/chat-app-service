// controllers/messageController.js
const messageService = require("../services/messageService");

module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, conversationId, page = 1, limit = 20 } = req.body;

    const {
      messages,
      currentPage,
      totalPages,
      hasMore,
      lastMessageId,
    } = await messageService.getMessages(conversationId, page, limit);

    if (messages.length > 0 && page === 1 && lastMessageId) {
      await messageService.updateLastReadMessage(conversationId, from, lastMessageId);
    }

    res.json({
      messages,
      currentPage,
      totalPages,
      hasMore,
    });
  } catch (ex) {
    next(ex);
  }
};

module.exports.addMessage = async (req, res, next) => {
  try {
    const data = await messageService.addMessage(req.body);

    if (data) {
      res.json({ msg: "Message added successfully.", data });
    } else {
      res.json({ msg: "Failed to add message to the database" });
    }
  } catch (ex) {
    next(ex);
  }
};
