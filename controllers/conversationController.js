const Conversations = require("../models/conversationModel");
const Messages = require("../models/messageModel");
const { getIoInstance } = require("../socket");

module.exports.createConversation = async (req, res, next) => {
  try {
    const { users } = req.body;

    let conversation = await Conversations.findOne({ users: { $all: users, $size: users.length } });

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

module.exports.getAllConversation = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const conversations = await Conversations.find({
      users: userId,
    }).populate("users");

    const conversationsWithUnreadCount = await Promise.all(conversations.map(async (conversation) => {
      const lastReadMessageId = conversation.lastReadMessage.get(userId);
      const unreadCount = await Messages.countDocuments({
        conversationId: conversation._id,
        _id: { $gt: lastReadMessageId || new mongoose.Types.ObjectId(0) },
        from: { $ne: userId }
      });

      return {
        ...conversation._doc,
        unreadCount
      };
    }));

    return res.json(conversationsWithUnreadCount);
  } catch (ex) {
    next(ex);
  }
};

module.exports.markConversationAsRead = async (req, res, next) => {
  try {
    const { conversationId, userId } = req.params;

    const lastMessage = await Messages.findOne({ conversationId }).sort({ createdAt: -1 });

    if (lastMessage) {
      await Conversations.findByIdAndUpdate(conversationId, {
        $set: { [`lastReadMessage.${userId}`]: lastMessage._id }
      });
    }

    res.json({ status: true, message: "Conversation marked as read" });
  } catch (ex) {
    next(ex);
  }
};
