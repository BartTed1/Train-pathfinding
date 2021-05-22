const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const stationsSchema = new Schema({
    "_id": {type: Number, required: true},
    "name": {type: String, required: true},
    "class": {type: String, required: true},
});

module.exports = mongoose.model("station", stationsSchema);