const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  username: String,
  email: String,
  password: String,
  bio: String,
  industry: String,
  role: String,
  volunteerOptions: [{type: Object}]
});

const volunteerOptionsSchema = new Schema({
  optionText: String,
  status: String
});

const User = mongoose.model('user', userSchema); 
const VolunteerOptions = mongoose.model('volunteerOptions', volunteerOptionsSchema);

module.exports = {
  User,
  VolunteerOptions
};