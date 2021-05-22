const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const relationSchema = new Schema({
    relation: {type: String, require: true},
    distance: {type: Number, require: true}
}, { _id : false });

module.exports = mongoose.model("relation", relationSchema);