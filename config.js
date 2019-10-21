const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const url = process.env.MONGODB_URL;

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.once('open', () => console.log(`Connected to mongo at ${url}`));