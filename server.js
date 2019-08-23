const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const resolvers = require('./resolvers');
require('./config');


const typeDefs = gql`
    type User {
        id: ID!
        username: String
        password: String
        email: String
        phone: String
        bio: String
        industry: String
        role: String
        volunteerOptions: [String!]
        accessToken: String
        error: String
        message: String
    }
    input UserInput {
        accessToken: String
        username: String
        password: String
        email: String
        phone: String
        bio: String
        industry: String
        role: String
        volunteerOptions: [String!]
    }
    type VolunteerOptions {
      id: String
      optionText: String
      status: String
    }
    type DonateStatus {
      email: String
      id: String
    }
    type ProfileInfo {
      email: String
      id: String
      userName: String
    }
    type Query {
        getUsers: [User]
        loginUser(password: String, email: String!): User
        getVolunteerOptions(status: String, email: String!, accessToken: String!) : [VolunteerOptions]!
    }
    type Mutation {
        addUser(userName: String!, email: String!): User
        updateUser(input: UserInput): User

        registerUser(userName: String!, email: String!, password: String!): User
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