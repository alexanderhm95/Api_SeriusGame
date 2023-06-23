const mongoose = require("mongoose");

const mongoosePaginate = require("mongoose-paginate-v2");
const { Schema } = mongoose;

const TestImageSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    section: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

TestImageSchema.plugin(mongoosePaginate);

const TestImages = mongoose.model("TestImages", TestImageSchema);
module.exports = TestImages;
