const mongoose = require("mongoose");
const { Schema } = mongoose;

const CasoSchema = new Schema(
  {
    dece: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dece",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    dateStart: {
      type: Date,
      required: true,
    },
    dateEnd: {
      type: Date,
    },
    status: {
      type: Boolean,
      default: true,
      required: true
    }
  },
  {
    versionKey: false,
  }
);

const Caso = mongoose.model("Caso", CasoSchema);
module.exports = Caso;
