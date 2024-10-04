const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversations",
      required: true,
    },
    message: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "text",
      enum: ["text", "image", "video", "audio"],
    },
    files: {
      type: Array,
      default: [],
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Messages", MessageSchema);
