let { getAccessToken, createError, verifyToken, mergeJsons } = require('../utils');
let { User, VolunteerOptions } = require('./models')

const ACTIVE = "ACTIVE"
const INACTIVE = "INACTIVE"

module.exports = {
    getUsers: async () => await User.find({}).exec(),
    loginUser: async (_, args) => {
        try {
            let user = await User.findOne({ email: args.email });
            if (user && user.password === args.password) {
                let token = getAccessToken(args.email);
                let response = mergeJsons(user, {accessToken: token});
                return response;
            }
            else {
                return createError('User with this email does not exist or the password is incorrect');
            }
        } catch (e) {
            return createError(e);
        }
    },
    getVolunteerOptions: async (_, args) => {
        try {
            let { accessToken, email, status } = args
            let verifiedToken = await verifyToken(accessToken)
            if (email === verifiedToken.email) {
                let userVolOptions = await VolunteerOptions.find({ status })
                console.log(userVolOptions, 'userVolOptions')
                return userVolOptions
            }
            else {
                return createError('User with this email does not exist or the password is incorrect')
            }
        } catch (e) {
            return createError(e)
        }
    }

};