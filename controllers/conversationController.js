const Conversations = require("../models/conversationModel");
const { getIoInstance } = require("../socket");

module.exports.createConversation = async (req, res, next) => {
  try {
    const { users } = req.body;

    let hasConversation = await Conversations.findOne({ users });

    if (!hasConversation) {
      hasConversation = await Conversations.create({ users });
    }
    hasConversation = await hasConversation.populate("users");

    const result  = { status: true, ...hasConversation._doc };
    // while conversation created
    const io = getIoInstance();
    io.emit("new-conversation", result);
    return res.json(result);
  } catch (ex) {
    next(ex);
  }
};

module.exports.getAllConversation = async (req, res, next) => {
  try {
    const conversations = await Conversations.find({
      users: req.params.id,
    }).populate("users");

    return res.json(conversations);
  } catch (ex) {
    next(ex);
  }
};
