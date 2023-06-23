const mongoose = require("mongoose");
const { Schema } = mongoose;

const TestStudentSchema = new Schema(
  {
    caso: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Caso",
      required: true,
    },
    scoreMax: {
      type: Number,
    },
    score: {
      type: Number,
      default: 0,
    },
    diagnostic: {
      type: String,
      default: null,
    },
    answers: [
      {
        refImages: {
          type: String,
        },
        valueAnswer: {
          type: Number,
        },
      },
    ],
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const TestStudent = mongoose.model("TestStudent", TestStudentSchema);
module.exports = TestStudent;
