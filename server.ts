import express from 'express'
import lodash from 'lodash'
import { GraphQLJSONObject } from 'graphql-type-json'
import gql from 'graphql-tag'
import resolvers from './resolvers'
import { ScalarDate } from './scalars'
import { makeExecutableSchema } from 'graphql-tools';
import graphqlHTTP from 'express-graphql';
import cors from 'cors'

require('./config');

const volunteerOptions = `
      id: String
      optionText: String
      status: String
`
const userInput = `
        username: String
        password: String
        email: String
        phone: String
        bio: String
        industry: String
        role: String
        twitterProfile: String
        twitterId: String
        instaProfile: String
        instaId: String
        fbProfile: String
        availableWhen: String
        availableWhat: String
`

const projects = `
      id: String,
      status: String,
      type: String,
      title: String,
      subtitle: String,
      cost: String,
      content: String,
      remaining: String,
`
const typeDefs = gql`
 
    scalar JSON
    scalar Date
    type User {
        id: ID!
        accessToken: String
        ${userInput}
        type: String
        error: String
        message: String
        responseStatus: Response
    }
    input UserInput {
        ${userInput}
        volunteerOptions: [VolunteerOptions]
    }
    input VolunteerOptions {
      ${volunteerOptions}
    }
    input SaplingOptionsInput {
      ${projects}
    }
    input UpdateProjectsInput {
      ${projects}
      createNewRow: Boolean
      removeRow: Boolean
    }
    type Projects {
      ${projects}
    }
    type DonateStatus {
      email: String
      id: String
      responseStatus: Response
    }
    type ProfileInfo {
      email: String
      id: String
      username: String
      responseStatus: Response
    }
    input DonationPaymentInput {
      email: String!
      token: String! 
      amount: Int! 
      items: [DonationItems]!
    }
    input DonationItems {
      id: String!
      title: String!
      count: Int!
    }
    input PhotoTimelineInput {
      treeId: Int!,
      isNewPhoto: Boolean!,
      text: String!,
      link: String!,
      order: Int
    }
    input GeoLocationInput {
      latitude: String,
      longitude: String
    }
    input UpdateUserDonationInput {
      treeId: Int!,
      status: String!,
      geoLocation: GeoLocationInput
    }

    type Response {
      status: String
      text: String
    }
    type PhotoTimeline{
      order: Int
      text: String
      photoUrl: String
    }
    type GeoLocation {
      latitude: String,
      longitude: String
    }
    type MyDonationsOut {
      email: String,
      instaProfile: String,
      twitterProfile: String,
      type: String,
      title: String,
      subtitle: String,
      cost: String,
      content: String,
      treeId: Int,
      responseStatus: Response,
      status: String,
      createdAt: Date,
      geoLocation: GeoLocation,
      photoTimeline: [PhotoTimeline]
    }
    
    type Status {
      status: String
      error: String
      responseStatus: Response
    }

    type ConfirmTokenResponse {
      responseStatus: Response
      email: String
    }

    type GetAllUsersResponse {
      users: [User]
      responseStatus: Response
    }

    type GetProjects {
      projects: [Projects]!
      responseStatus: Response
    }

    type MyDonationsResponse {
      myDonations: [MyDonationsOut]
      responseStatus: Response
    }

    type AllDonationsResponse {
      allDonations: [MyDonationsOut]
      responseStatus: Response
    }

    type UpdateProjectsResponse {
      response: [Projects]!
      status: String
      error: String
      responseStatus: Response
    }

    type UpdateUsersResponse {
      response: [User]!
      responseStatus: Response
    }

    type DonationPaymentOutput {
      status: String
      error: String
      referenceId: String
      responseStatus: Response
    }

    type UpdatedUserDonationResponse {
      myDonation: MyDonationsOut
      responseStatus: Response
    }

    type EmailAvailableResponse {
      email: String
      emailAvailable: Boolean
      responseStatus: Response
    }

    type Query {
        isEmailAvailable(email: String): EmailAvailableResponse
        loginUser(password: String, email: String): User
        getUser(email: String, twitterId: String, instaId: String): User
        forgotPassword(email: String!): Status
        confirmToken(token: String!): ConfirmTokenResponse
        getAllUsers(email: String, twitterId: String, instaId: String): GetAllUsersResponse

        getProjects(status: String): GetProjects
        myDonations(email: String, twitterId: String, instaId: String): MyDonationsResponse
        getAllUserDonations(email: String, twitterId: String, instaId: String): AllDonationsResponse
    }
    type Mutation {
        updateUser(input: UserInput): User
        updateUsers(input: [UserInput], email: String, twitterId: String, instaId: String): UpdateUsersResponse

        registerUser(username: String!, email: String!, password: String!, phone: String!): User
        resetPassword(password: String!, confirmPassword: String!, token: String!): Status
        makeDonation(input: DonationPaymentInput, email: String, twitterId: String, instaId: String): DonationPaymentOutput
        updateUserDonations(input: [UpdateUserDonationInput]!, email: String, twitterId: String, instaId: String): AllDonationsResponse
        addPhotoToTimeline(input: PhotoTimelineInput, email: String, twitterId: String, instaId: String): UpdatedUserDonationResponse
        
        updateProjects(input: [UpdateProjectsInput]!, email: String, twitterId: String, instaId: String) : UpdateProjectsResponse
    }
`;

const schema = makeExecutableSchema({
  typeDefs,
  resolvers: lodash.assign({ JSON: GraphQLJSONObject, Date: ScalarDate }, resolvers),
});

const app: express.Application = express()

app.use(cors({ origin: process.env.FRONTEND_URL }))
app.use('/graphql', cors({ origin: process.env.FRONTEND_URL }),
  graphqlHTTP((request, response, graphQLParams) => ({
    schema,
    graphiql: !(process.env.NODE_ENV === 'production'),
    context: { headers: request.headers }
  })))

const port = process.env.PORT || 5000
app.listen({ port }, () =>
  console.log(`🚀 Server ready at http://localhost:${port}/graphql`)

);