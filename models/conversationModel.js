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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Conversations", conversationSchema);
