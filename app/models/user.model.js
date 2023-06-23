const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    person: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Person",
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["ADMIN", "DECE", "TEACHER"],
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
    recoverCode: {
      type: String,
      default: null,
    },
    recoverCodeExp: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
const User = mongoose.model("User", UserSchema);
module.exports = User;
