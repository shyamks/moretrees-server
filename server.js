const express = require('express');
const lodash = require('lodash')

const {GraphQLJSONObject} = require('graphql-type-json');
const { ApolloServer, gql } = require('apollo-server-express');
const resolvers = require('./resolvers');

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
`

const saplingOptions = `
      id: String,
      status: String,
      saplingName: String,
      saplingImage: String,
      saplingCost: String,
      remainingSaplings: String,
`
const typeDefs = gql`
 
    scalar JSON
    type User {
        id: ID!
        accessToken: String
        ${userInput}
        volunteerOptions: [VolunteerOptionsOutput!]
        error: String
        message: String
    }
    input UserInput {
        ${userInput}
        volunteerOptions: [VolunteerOptions!]
    }
    type VolunteerOptionsOutput {
      ${volunteerOptions}
    }
    input VolunteerOptions {
      ${volunteerOptions}
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
      donationAmount: Int! 
      items: [DonationItems]!
    }
    input DonationItems {
      id: String!
      saplingName: String!
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
      donationAmount: Int
      items: [JSON]
      token: String
      createdAt: String
      paymentDetails: JSON
    }
    
    type Status {
      status: String
      error: String
    }
    type Query {
        getUsers: [User]
        loginUser(password: String, email: String!): User
        getUser(email: String!): User
        getVolunteerOptions(status: String): [VolunteerOptionsOutput]!
        getSaplingOptions(status: String): [SaplingOptionsOutput]!
        myDonations(email: String): [MyDonationsOut]
    }
    type Mutation {
        addUser(username: String!, email: String!): User
        updateUser(input: UserInput): User

        registerUser(username: String!, email: String!, password: String!): User
        makePayment(username: String!, email: String!, token: String!): Status
        makeDonation(input: DonationPaymentInput): DonationPaymentOutput
    }
`;

const server = new ApolloServer({
  typeDefs,
  resolvers : lodash.assign({JSON: GraphQLJSONObject}, resolvers),
  introspection: true,
  playground: true,
  context: ({ req }) => {
    let headers = req.headers
    return { headers }
  }
});
const app = express();
server.applyMiddleware({ app });

app.listen({ port: 5000 }, () =>
  console.log(`🚀 Server ready at http://localhost:5000${server.graphqlPath}`)
);