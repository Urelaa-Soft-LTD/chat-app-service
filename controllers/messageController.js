const Messages = require("../models/messageModel");

module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, conversationId } = req.body;
   

    const messages = await Messages.find({
      conversationId: conversationId,
    }).sort({ updatedAt: 1 });

    // const projectedMessages = messages.map((msg) => {
    //   return {
    //     fromSelf: msg.sender.toString() === from,
    //     message: msg.message.text,
    //   };
    // });
    res.json(messages);
  } catch (ex) {
    next(ex);
  }
};

module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, conversationId, message,type ,files} = req.body;
   
    const data = await Messages.create({
      from,
      conversationId,
      message,
      type,
      files
    });

    if (data) return res.json({ msg: "Message added successfully.",data });
    else return res.json({ msg: "Failed to add message to the database" });
  } catch (ex) {
    next(ex);
  }
};
