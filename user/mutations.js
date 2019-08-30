let { getAccessToken, createError, mergeJsons, getEmailFromContext } = require('../utils');
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
    updateUser: async (_, args, context) => {
        try {
            let { input } = args;

            let { username, password, email, phone, bio, industry, role, volunteerOptions } = input
            let emailFromToken = await getEmailFromContext(context)
            if (email === emailFromToken) {
                const user = await User.findOne({ email });
                if (!user) return createError('Email already exists. Please try another email');
                let finalInput = { bio, industry, phone, role, volunteerOptions }
                const mergedUserForResponse = mergeJsons(user, finalInput)
                let response = await mergedUserForResponse.save()
                return response ? response : createError('Error occured during update')
            }
        } catch (e) {
            return createError(e);
        }
    }
};