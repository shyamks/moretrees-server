const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  userName: String,
  email: String,
  password: String,
  // bio: String,
  // industry: String,
  // role: String
  // volunteerOptions; [{type: String}]
});

const volunteerOptionsSchema = new Schema({
  userName: String,
  email: String,
  options: [{type: String}]
});

const User = mongoose.model('user', userSchema); 
const VolunteerOptions = mongoose.model('VolunteerOptions', volunteerOptionsSchema);

module.exports = {
  User,
  VolunteerOptions
};