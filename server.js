const express = require('express')
const lodash = require('lodash')
const { GraphQLJSONObject } = require('graphql-type-json')
const { ApolloServer, gql } = require('apollo-server-express')
const resolvers = require('./resolvers')

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

    type MyDonationsOut {
      id: String
      email: String
      amount: Int
      items: [JSON]
      token: String
      createdAt: String
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

        getSaplingOptions(status: String): [SaplingOptionsOutput]!
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
  resolvers: lodash.assign({ JSON: GraphQLJSONObject }, resolvers),
  introspection: true,
  playground: true,
  context: ({ req }) => {
    let headers = req.headers
    return { headers }
  },
  formatError: error => {
    return error;
  },
  formatResponse: (response, query) => {
    return response;
  },
});
const app = express();

server.applyMiddleware({ app });

app.listen({ port: 5000 }, () =>
  console.log(`🚀 Server ready at http://localhost:5000${server.graphqlPath}`)
);