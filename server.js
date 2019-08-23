const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const resolvers = require('./resolvers');
require('./config');

const volunteerOptions = `
      id: String
      optionText: String
      status: String
`
const userInput = `
        accessToken: String
        username: String
        password: String
        email: String
        phone: String
        bio: String
        industry: String
        role: String
`
const typeDefs = gql`
    type User {
        id: ID!
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
    type DonateStatus {
      email: String
      id: String
    }
    type ProfileInfo {
      email: String
      id: String
      username: String
    }
    type Query {
        getUsers: [User]
        loginUser(password: String, email: String!): User
        getVolunteerOptions(status: String, email: String!, accessToken: String!): [VolunteerOptionsOutput]!
    }
    type Mutation {
        addUser(username: String!, email: String!): User
        updateUser(input: UserInput): User

        registerUser(username: String!, email: String!, password: String!): User
    }
`;

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: true
});
const app = express();
server.applyMiddleware({ app });

app.listen({ port: 4000 }, () =>
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
);