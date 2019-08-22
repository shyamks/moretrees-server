let { getAccessToken, createError, verifyToken } = require('../utils');
const { User, VolunteerOptions } = require('./models');

module.exports = {
    registerUser: async (_, args) => {
        try {
            const { userName, password, email } = args;
            const user = await User.find({ email: args.email });
            console.log(user, 'wlwllw')
            if (!user.length) {
                let response = await User.create({ userName, password, email });
                response.accessToken = getAccessToken(args.email);
                return response;
            }
            else {
                return createError('Email already exists. Please try another email');
            }
        } catch (e) {
            return createError(e);
        }
    },
    submitVolunteerOptions: async (_, args) => {
        try {
            const { options, email, accessToken } = args;
            const user = await User.findOne({ email });
            let verifiedToken = await verifyToken(accessToken)
            if (user && email === verifiedToken.email) {
                let response = await VolunteerOptions.create({ userName: user.userName, options, email });
                return response;
            }
            else {
                return createError('Email does not exist. Please try another email');
            }
        } catch (e) {
            return createError(e);
        }
    }
};