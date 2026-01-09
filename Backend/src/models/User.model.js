const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    studentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["Student", "Consultant", "Admin"],
      default: "Student",
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    passwordHash: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
    },
  },
  { timestamps: true }
);

// ✅ used during login
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model("User", userSchema);
