const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const resolvers = require('./resolvers');
require('./config');


const typeDefs = gql`
    type User {
        id: ID!
        userName: String
        email: String
        accessToken: String
        error: String
        message: String
    }
    type VolunteerOptions {
      id: String
      userName: String
      email: String
      options: [String!]
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
        getVolunteerOptions(email: String!, accessToken: String!) : VolunteerOptions
    }
    type Mutation {
        addUser(userName: String!, email: String!): User
        registerUser(userName: String!, email: String!, password: String!): User
        submitVolunteerOptions(email: String!, options: [String!], accessToken: String): VolunteerOptions
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