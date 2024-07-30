const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      min: 3,
      max: 20,
      unique: true,
    },
    profilePicture: String,
    lastActive: String,
    inActive: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Users", userSchema);
