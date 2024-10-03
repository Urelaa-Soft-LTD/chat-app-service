const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true
      }
    ],
    lastReadMessage: {
      type: Map,
      of: mongoose.Schema.Types.ObjectId,
      default: {}
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Conversations", conversationSchema);
