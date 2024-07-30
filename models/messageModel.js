const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema(
  {
    message: {
      type: String,
      default: "",
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversations",
      required: true,
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["text", "image", "video", "audio", "documents"],
    },
    files: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Messages", MessageSchema);
