let { getAccessToken, createError, verifyToken } = require('../utils');
let { User, VolunteerOptions} = require('./models')

module.exports = {
    getUsers: async () => await User.find({}).exec(),
    loginUser: async (_, args) => {
        try {
            let user = await User.findOne({ email: args.email });
            if (user && user.password === args.password) {
                let token = getAccessToken(args.email);
                let response = user;
                response.accessToken = token;
                return response;
            }
            // let response = await User.create(args);
            else {
                return createError('User with this email does not exist or the password is incorrect');
            }
        } catch (e) {
            return createError(e);
        }
    },
    getVolunteerOptions: async (_, args) => {
        try {
            let {accessToken, email} = args
            let verifiedToken = await verifyToken(accessToken)
            if (email === verifiedToken.email) {
                let userVolOptions = await VolunteerOptions.findOne({ email })
                console.log(userVolOptions,'userVolOptions')
                return userVolOptions
            }
            // let response = await User.create(args)
            else {
                return createError('User with this email does not exist or the password is incorrect')
            }
        } catch (e) {
            return createError(e)
        }
    }

};