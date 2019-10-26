const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
let ObjectId = mongoose.Schema.Types.ObjectId;

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

const projectsSchema = new Schema({
  status: String,
  type: String,
  title: String,
  subtitle: String,
  cost: String,
  content: String,
  remaining: String,
})

const userDonationsSchema = new Schema({
  userId: ObjectId,
  treeId: Number,
  status: String,
  type: String,
  title: String,
  subtitle: String,
  cost: String,
  content: String,
  photoTimeline: [{
    text: String,
    photoUrl: String
  }]
})
userDonationsSchema.plugin(AutoIncrement, { inc_field: 'treeId' })

const projectDonationsSchema = new Schema({
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
const UserDonations = mongoose.model('userdonations', userDonationsSchema);

const Projects = mongoose.model('projects', projectsSchema);
const ProjectDonations = mongoose.model('projectdonations', projectDonationsSchema);

module.exports = {
  User,
  UserDonations,
  Projects,
  ProjectDonations
};