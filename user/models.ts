import mongoose from 'mongoose'
let ObjectId = mongoose.Schema.Types.ObjectId

const { Schema } = mongoose

export const COLLECTION_NAME = {
  PROJECTS:'projects',
  USERS: 'users',
  USER_DONATIONS: 'userdonations',
  PROJECT_DONATIONS_PAYMENT_INFO: 'projectdonationspaymentinfo',
  COUNTERS: 'counters'
}
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
  resetPasswordExpiry: Date,
  accessToken: String
})
export const Users = mongoose.model<UserInterface>(COLLECTION_NAME.USERS, userSchema)
export interface UserInterface extends mongoose.Document {
  id: string,
  accessToken?: string,
  username: string,
  email: string,
  password: string,
  mobile: string,
  bio: string,
  industry: string,
  role: string,
  twitterProfile: string,
  twitterId: string,
  instaProfile: string,
  instaId: string,
  fbProfile: string,
  type: string,
  volunteerOptions: [{ type: Object }],
  availableWhen: string,
  availableWhat: string,
  createdAt: Date,
  resetPasswordToken: string,
  resetPasswordExpiry: Date
}

const userDonationsSchema = new Schema({
  userId: ObjectId,
  treeId: Number,
  status: String,
  projectId: ObjectId,
  createdAt: Date,
  geoLocation: {
    latitude: String,
    longitude: String
  },
  photoTimeline: [{
    order: Number,
    text: String,
    photoUrl: String
  }]
})
export const UserDonations = mongoose.model<UserDonationInterface>(COLLECTION_NAME.USER_DONATIONS, userDonationsSchema)
export interface UserDonationInterface extends mongoose.Document{
  id: string,
  userId: string,
  treeId: number,
  status: string,
  projectId: string,
  createdAt: Date,
  geoLocation: {
    latitude: string,
    longitude: string
  },
  photoTimeline?: PhotoTimelineInterface[]
}

export interface PhotoTimelineInterface {
  order: number,
  text: string,
  photoUrl: string
}

const projectsSchema = new Schema({
  status: String,
  type: String,
  title: String,
  subtitle: String,
  cost: String,
  content: String,
  remaining: Number,
})
export const Projects = mongoose.model<ProjectInterface>(COLLECTION_NAME.PROJECTS, projectsSchema)
export interface ProjectInterface extends mongoose.Document {
  id: string,
  status: string,
  type: string,
  title: string,
  subtitle: string,
  cost: string,
  content: string,
  remaining: number
}

const counterSchema = new Schema({
  counterValue: Number,
  collectionName: String
})
export const Counters = mongoose.model<CounterInterface>(COLLECTION_NAME.COUNTERS, counterSchema)
export interface CounterInterface extends mongoose.Document {
  counterValue: number,
  collectionName: string
}

const projectDonationsPaymentInfoSchema = new Schema({
  userId: ObjectId,
  amount: Number,
  items: [{type: Object}],
  token: String,
  createdAt: { type: Date, default: Date.now },
  paymentDetails: {type: Object}
})
export const ProjectDonationsPaymentInfo = mongoose.model<ProjectDonationsPaymentInfoInterface>(COLLECTION_NAME.PROJECT_DONATIONS_PAYMENT_INFO, projectDonationsPaymentInfoSchema, COLLECTION_NAME.PROJECT_DONATIONS_PAYMENT_INFO)
export interface ProjectDonationsPaymentInfoInterface extends mongoose.Document {
  id: string,
  userId: string,
  amount: number,
  items: [{type: Object}],
  token: string,
  createdAt: Date,
  paymentDetails: {type: Object}
}


export interface DonationItemInterface  {
  projectId: string,
  title: string,
  count: number
}

