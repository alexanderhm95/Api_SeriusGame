const mongoose = require("mongoose");
const { Schema } = mongoose;

const TestStudentSchema = new Schema(
  {
    caso: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Caso",
      required: true,
      unique: true
      
    },
    scoreMax: {
      type: Number,
    },
    score: {
      type: Number,
      default: 0,
    },
    scoreEvaluator:{
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
          required: true,
        },
        valueAnswer: {
          type: Number,
          required: true,
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


// Agrega el índice en el campo 'caso'
TestStudentSchema.index({ caso: 1 });

const TestStudent = mongoose.model("TestStudent", TestStudentSchema);
module.exports = TestStudent;
