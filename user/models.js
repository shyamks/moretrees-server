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
  volunteerOptions: [{type: Object}]
});

const volunteerOptionsSchema = new Schema({
  optionText: String,
  status: String
});

const saplingOptionsSchema = new Schema({
  status: String,
  saplingName: String,
  saplingImage: String,
  saplingCost: String,
  remainingSaplings: String,
})

const userSaplingDonationSchema = new Schema({
   email: String,
   amount: Number,
   donationAmount: Number,
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