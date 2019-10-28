import express from 'express'
import lodash from 'lodash'
import path from 'path'
import https from 'https'
import fs from 'fs'
import { GraphQLJSONObject } from 'graphql-type-json'
import { ApolloServer, gql } from 'apollo-server-express'
import resolvers from './resolvers'
import { ScalarDate } from './scalars'

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

const saplingOptions = `
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
        type: String,
        error: String
        message: String
    }
    input UserInput {
        ${userInput}
        volunteerOptions: [VolunteerOptions]
    }
    input VolunteerOptions {
      ${volunteerOptions}
    }
    input SaplingOptionsInput {
      ${saplingOptions}
    }
    input UpdateSaplingsInput {
      ${saplingOptions}
      createNewRow: Boolean
      removeRow: Boolean
    }
    type SaplingOptionsOutput {
      ${saplingOptions}
    }
    type DonateStatus {
      email: String
      id: String
    }
    type ProfileInfo {
      email: String
      id: String
      username: String
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

    type DonationPaymentOutput {
      status: String
      error: String
      referenceId: String
    }

    type PhotoTimeline{
      order: Int,
      text: String,
      photoUrl: String
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
      status: String,
      createdAt: Date,
      photoTimeline: [PhotoTimeline]
    }
    
    type Status {
      status: String
      error: String
    }

    type UpdateSaplingsResponse {
      response: [SaplingOptionsOutput]!
      status: String
      error: String
    }

    type UpdateUsersResponse {
      response: [User]!
      status: String
      error: String
    }

    type Query {
        loginUser(password: String, email: String!): User
        getUser(email: String, twitterId: String, instaId: String): User
        forgotPassword(email: String!): Status
        confirmToken(token: String!): Status
        getAllUsers(email: String, twitterId: String, instaId: String): [User]

        getProjects(status: String): [SaplingOptionsOutput]!
        myDonations(email: String, twitterId: String, instaId: String): [MyDonationsOut]
        getAllUserDonations(email: String, twitterId: String, instaId: String): [MyDonationsOut]
    }
    type Mutation {
        updateUser(input: UserInput): User
        updateUsers(input: [UserInput], email: String, twitterId: String, instaId: String): UpdateUsersResponse

        registerUser(username: String!, email: String!, password: String!, phone: String): User
        resetPassword(password: String!, confirmPassword: String!, token: String!): Status
        makeDonation(input: DonationPaymentInput, email: String, twitterId: String, instaId: String): DonationPaymentOutput
        updateSaplings(input: [UpdateSaplingsInput]!, email: String, twitterId: String, instaId: String) : UpdateSaplingsResponse
    }
`;

const server = new ApolloServer({
  typeDefs,
  resolvers: lodash.assign({ JSON: GraphQLJSONObject, Date: ScalarDate }, resolvers),
  introspection: true,
  playground: true,
  context: ({ req }: any) => {
    let headers = req.headers
    return { headers }
  },
  formatError: (error: any) => {
    return error;
  },
  formatResponse: (response: any, query: any) => {
    return response;
  },
});
const app: express.Application = express()

server.applyMiddleware({ app });

app.listen({ port: 5000 }, () =>
  console.log(`🚀 Server ready at http://localhost:5000${server.graphqlPath}`)

);