const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const daysOperationSchema = new Schema({
    0: {type: Boolean, required: true},
    1: {type: Boolean, required: true},
    2: {type: Boolean, required: true},
    3: {type: Boolean, required: true},
    4: {type: Boolean, required: true},
    5: {type: Boolean, required: true},
    6: {type: Boolean, required: true},
    except: {type: Array, required: true}
}, { _id : false });

const trainSchema = new Schema({
    _id: {type: String, required: true},
    name: {type: String, required: true},
    stations: {type: Object, required: true},
    daysOperation: daysOperationSchema,
    class: {type: String, required: true}
});

module.exports = mongoose.model("train", trainSchema);