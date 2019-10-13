let { getAccessToken, createError, mergeJsons, getEmailFromContext } = require('../utils');
let { User, VolunteerOptions, SaplingOptions, UserSaplingDonation } = require('./models')

const ACTIVE = "ACTIVE"
const INACTIVE = "INACTIVE"

module.exports = {
    loginUser: async (_, args) => {
        try {
            let user = await User.findOne({ email: args.email });
            if (user && user.password === args.password) {
                let token = getAccessToken(args.email);
                let response = mergeJsons(user, { accessToken: token });
                return response;
            }
            else {
                return createError('User with this email does not exist or the password is incorrect');
            }
        } catch (e) {
            return createError(e);
        }
    },
    getUser: async (_, args, context) => {
        try {
            let { email } = args
            let emailFromToken = await getEmailFromContext(context)
            if (email === emailFromToken) {
                let user = await User.findOne({ email });
                return user
                // let userVolOptions = await VolunteerOptions.find({ status })
                // return userVolOptions
            }
            else {
                return createError('User with this email does not exist or the password is incorrect')
            }
        } catch (e) {
            return createError(e)
        }
    },
    getAllUsers: async (_, args, context) => {
        try {
            let { email } = args
            let emailFromToken = await getEmailFromContext(context)
            if (email === emailFromToken) {
                let users = await User.find({});
                return users
                // let userVolOptions = await VolunteerOptions.find({ status })
                // return userVolOptions
            }
            else {
                return createError('User with this email does not exist or the password is incorrect')
            }
        } catch (e) {
            return createError(e)
        }
    },
    getVolunteerOptions: async (_, args, context) => {
        try {
            let { status } = args
            let userVolOptions = await VolunteerOptions.find({ status })
            return userVolOptions
        } catch (e) {
            return createError(e)
        }
    },
    getSaplingOptions: async (_, args, context) => {
        let { status } = args
        let saplingOptions = await SaplingOptions.find(status ? { status }: { })
        return saplingOptions
    },
    myDonations: async (_, args, context) => {
        try {
            let { email } = args
            let emailFromToken = await getEmailFromContext(context)
            if (email === emailFromToken) {
                let userDonations = await UserSaplingDonation.find({ email });
                return userDonations
            }
            else {
                return createError('User with this email does not exist or the password is incorrect')
            }
        } catch (e) {
            return createError(e)
        }
    },
    getAllUserDonations: async (_, args, context) => {
        try {
            let { email } = args
            let emailFromToken = await getEmailFromContext(context)
            if (email === emailFromToken) {
                let userDonations = await UserSaplingDonation.find({});
                return userDonations
            }
            else {
                return createError('User with this email does not exist or the password is incorrect')
            }
        } catch (e) {
            return createError(e)
        }
    }

};