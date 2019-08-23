let { getAccessToken, createError, verifyToken, mergeJsons } = require('../utils');
const { User, VolunteerOptions } = require('./models');

module.exports = {
    registerUser: async (_, args) => {
        try {
            const { username, password, email } = args;
            const user = await User.find({ email: args.email });
            console.log(user, 'wlwllw')
            if (!user.length) {
                let response = await User.create({ username, password, email });
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
    updateUser: async (_, args) => {
        try {
            let { input } = args;
            console.log(args,'sadf')
            let { accessToken, username, password, email, phone, bio, industry, role, volunteerOptions } = input
            const user = await User.findOne({ email });
            let verifiedToken = await verifyToken(accessToken)
            if (email === verifiedToken.email && user) {
                const mergedUserForResponse = mergeJsons(user, input)
                let response = await User.updateOne(mergedUserForResponse);
                return response.ok ? mergedUserForResponse : createError('Error occured during update')
            }
            else {
                return createError('Email already exists. Please try another email');
            }
        } catch (e) {
            return createError(e);
        }
    }
};