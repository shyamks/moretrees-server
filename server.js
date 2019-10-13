const express = require('express');
const lodash = require('lodash')

const { GraphQLJSONObject } = require('graphql-type-json');
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
        twitterProfile: String
        instaProfile: String
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
        volunteerOptions: [VolunteerOptionsOutput!]
        error: String
        message: String
    }
    input UserInput {
        ${userInput}
        volunteerOptions: [VolunteerOptions]
    }
    type VolunteerOptionsOutput {
      ${volunteerOptions}
    }
    input VolunteerOptions {
      ${volunteerOptions}
    }
    input SaplingOptionsInput {
      ${saplingOptions}
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
    type Query {
        loginUser(password: String, email: String!): User
        getUser(email: String!): User
        getAllUsers(email: String!): [User]

        getVolunteerOptions(status: String): [VolunteerOptionsOutput]!
        getSaplingOptions(status: String): [SaplingOptionsOutput]!
        myDonations(email: String): [MyDonationsOut]
        getAllUserDonations(email: String!): [MyDonationsOut]
    }
    type Mutation {
        updateUser(input: UserInput): User
        updateUsers(input: [UserInput], email: String!): Status

        registerUser(username: String!, email: String!, password: String!, phone: String): User
        makePayment(username: String!, email: String!, token: String!): Status
        makeDonation(input: DonationPaymentInput): DonationPaymentOutput
        updateSaplings(input: [SaplingOptionsInput]!, email: String!) : Status
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
    // logger.warn(error);
    return error;
  },
  formatResponse: (response, query) => {
    // logger.info('GraphQL query and variables', {
    //   query: query.queryString,
    //   vars: query.variables,
    // });
    // const omitTypename = (key, value) => (key === '__typename' ? undefined : value);
    // let finalResponse = JSON.parse(JSON.stringify(response), omitTypename);
    return response;
  },
});
const app = express();
server.applyMiddleware({ app });

app.listen({ port: 5000 }, () =>
  console.log(`🚀 Server ready at http://localhost:5000${server.graphqlPath}`)
);