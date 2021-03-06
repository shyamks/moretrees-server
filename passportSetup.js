const passport = require("passport");
const TwitterStrategy = require("passport-twitter");
const { User } = require('./user/models')
const { TWITTER, INSTA, getAccessToken } = require('./utils')
// serialize the user.id to save in the cookie session
// so the browser will remember the user when login
passport.serializeUser((user, done) => {
    done(null, user._doc._id);
});

// deserialize the cookieUserId to user in the database
passport.deserializeUser((id, done) => {
    User.findById(id)
        .then(user => {
            done(null, user);
        })
        .catch(e => {
            done(new Error("Failed to deserialize an user"));
        });
});

passport.use(
    new TwitterStrategy(
        {
            consumerKey: process.env.TWITTER_CONSUMER_KEY,
            consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
            callbackURL: "/auth/twitter/redirect"
        },
        async (token, tokenSecret, profile, done) => {
            // find current user in UserModel
            console.log(profile, 'profile data')
            const currentUser = await User.findOne({
                twitterId: profile._json.id_str
            });
            // create new user if the database doesn't have this user
            if (!currentUser) {
                const newUser = await User.create({
                    username: profile._json.name,
                    twitterId: profile._json.id_str,
                    twitterProfile: profile._json.screen_name,
                    createdAt: new Date()
                    // profileImageUrl: profile._json.profile_image_url
                })
                if (newUser) {
                    let accessToken = getAccessToken(TWITTER, newUser.twitterId)
                    done(null, { ...newUser, accessToken });
                }
            }
            else{
                let accessToken = getAccessToken(TWITTER, currentUser.twitterId)
                done(null, { ...currentUser, accessToken });
            }
        }
    )
);