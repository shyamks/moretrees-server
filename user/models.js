const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  username: String,
  email: String,
  password: String,
  mobile: String,
  bio: String,
  industry: String,
  role: String,
  twitterProfile: String,
  twitterId: String,
  instaProfile: String,
  instaId: String,
  fbProfile: String,
  type: String,
  volunteerOptions: [{type: Object}],
  availableWhen: String,
  availableWhat: String,
  createdAt: Date,
  resetPasswordToken: String,
  resetPasswordExpiry: Date
});

const volunteerOptionsSchema = new Schema({
  optionText: String,
  status: String
});

const saplingOptionsSchema = new Schema({
  status: String,
  type: String,
  title: String,
  subtitle: String,
  cost: String,
  content: String,
  remaining: String,
})

const userSaplingDonationSchema = new Schema({
   email: String,
   twitterId: String,
   instaId: String,
   amount: Number,
   items: [{type: Object}],
   token: String,
   createdAt: { type: Date, default: Date.now },
   paymentDetails: {type: Object}
})

const User = mongoose.model('user', userSchema); 
const VolunteerOptions = mongoose.model('volunteerOptions', volunteerOptionsSchema);
const SaplingOptions = mongoose.model('saplingOptions', saplingOptionsSchema);
const UserSaplingDonation = mongoose.model('userSaplingDonation', userSaplingDonationSchema);

module.exports = {
  User,
  VolunteerOptions,
  SaplingOptions,
  UserSaplingDonation
};