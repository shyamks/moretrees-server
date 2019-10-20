const TWITTER_TOKENS = {
    TWITTER_CONSUMER_KEY: "",
    TWITTER_CONSUMER_SECRET: "",
    TWITTER_ACCESS_TOKEN: "",
    TWITTER_TOKEN_SECRET: ""
  };
  
//   const DB_USER = "SOME USER";
//   const DB_PASSWORD = "SOME PASSWPORD";
//   const MONGODB = {
//     MONGODB_URI: `mongodb://${DB_USER}:${DB_PASSWORD}@ds<SOME_DOMAIN>.mlab.com:<PORT>/<PROJECT_NAME>`
//   };
  
  const SESSION = {
    COOKIE_KEY: "thisappisawesome"
  };
  
  const KEYS = {
    ...TWITTER_TOKENS,
    ...SESSION
  };
  
  module.exports = KEYS;