const mongoose = require('mongoose');
const { Schema } = mongoose;

const DeceSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    status: {
        type: Boolean,
        default: true,
      },
},
    {
        timestamps: true,
        versionKey: false
    }
);

const Dece = mongoose.model('Dece', DeceSchema);
module.exports = Dece;