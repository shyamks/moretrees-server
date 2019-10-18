const express = require('express')
const lodash = require('lodash')

const { GraphQLJSONObject } = require('graphql-type-json')
const { ApolloServer, gql } = require('apollo-server-express')
const resolvers = require('./resolvers')

const cookieSession = require("cookie-session")
const cookieParser = require("cookie-parser")
const keys = require("./keys")
const cors = require("cors")
const passport = require("passport")
const passportSetup = require("./passportSetup")
const authRoutes = require('./authRoutes')

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
        getAllUsers(email: String, twitterId: String, instaId: String): [User]

        getVolunteerOptions(status: String): [VolunteerOptionsOutput]!
        getSaplingOptions(status: String): [SaplingOptionsOutput]!
        myDonations(email: String, twitterId: String, instaId: String): [MyDonationsOut]
        getAllUserDonations(email: String, twitterId: String, instaId: String): [MyDonationsOut]
    }
    type Mutation {
        updateUser(input: UserInput): User
        updateUsers(input: [UserInput], email: String, twitterId: String, instaId: String): UpdateUsersResponse

        registerUser(username: String!, email: String!, password: String!, phone: String): User
        makePayment(username: String!, email: String, twitterId: String, instaId: String, token: String!): Status
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

app.use(
  cookieSession({
    name: "session",
    keys: [keys.COOKIE_KEY],
    maxAge: 24 * 60 * 60 * 100
  })
);

// parse cookies
app.use(cookieParser());

// initalize passport
app.use(passport.initialize());
// deserialize cookie from the browser
app.use(passport.session());

const HEROKU_FE = "https://moretrees-client.herokuapp.com"
const LOCAL_FE = 'http://localhost:3000'
app.use(
  cors({
    origin: LOCAL_FE, // allow to server to accept request from different origin
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true // allow session cookie from browser to pass through
  })
);

// set up routes
app.use("/auth", authRoutes);

const authCheck = (req, res, next) => {
  if (!req.user) {
    res.status(401).json({
      authenticated: false,
      message: "user has not been authenticated"
    });
  } else {
    next();
  }
};

// if it's already login, send the profile response,
// otherwise, send a 401 response that the user is not authenticated
// authCheck before navigating to home page
app.get("/", authCheck, (req, res) => {
  res.status(200).json({
    authenticated: true,
    message: "user successfully authenticated",
    user: req.user,
    cookies: req.cookies
  });
});


server.applyMiddleware({ app });

app.listen({ port: 5000 }, () =>
  console.log(`🚀 Server ready at http://localhost:5000${server.graphqlPath}`)
);