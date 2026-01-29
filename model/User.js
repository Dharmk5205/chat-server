const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  avatar: { type: String, default: "" },
  password: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
