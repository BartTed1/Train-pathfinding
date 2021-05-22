const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/train_timetable', {useNewUrlParser: true, useUnifiedTopology: true});