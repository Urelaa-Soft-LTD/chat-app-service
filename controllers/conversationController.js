const conversationService =  require("../services/conversationService");

module.exports.createConversation = async (req, res, next) => {
  try {
    const { users } = req.body;
    const result = await conversationService.createConversation(users);
    return res.json(result);
  } catch (ex) {
    next(ex);
  }
};

module.exports.getAllConversation = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { searchName } = req.query;
    
    const conversations = await conversationService.getAllConversations(userId, searchName);
    return res.json(conversations);
  } catch (ex) {
    console.error("Error in getAllConversation:", ex);
    next(ex);
  }
};

module.exports.markConversationAsRead = async (req, res, next) => {
  try {
    const { userId, conversationId } = req.params;
    const result = await conversationService.markConversationAsRead(userId, conversationId);
    res.json(result);
  } catch (ex) {
    next(ex);
  }
};

module.exports.deleteConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const result = await conversationService.deleteConversation(conversationId);
    res.json(result);
  } catch (ex) {
    if (ex.message === "Conversation not found") {
      return res.status(404).json({ status: false, message: ex.message });
    }
    next(ex);
  }
};