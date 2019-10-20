let { getAccessToken, sendMail, confirmValidityOfUser, createError, mergeJsons, getEmailFromContext, EMAIL, TWITTER, FE } = require('../utils');
let { User, VolunteerOptions, SaplingOptions, UserSaplingDonation } = require('./models')

const crypto = require('crypto')

module.exports = {
    loginUser: async (_, args) => {
        try {
            let user = await User.findOne({ email: args.email });
            if (user && user.password === args.password) {
                let token = getAccessToken(EMAIL, args.email);
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
    forgotPassword: async (_, args) => {
        try {
            let user = await User.findOne({ email: args.email });
            if (user) {
                const token = crypto.randomBytes(20).toString('hex')
                let finalInput = {
                    resetPasswordToken: token,
                    resetPasswordExpiry: Date.now() + 60 * 60 * 100
                }

                const mergedUserForResponse = mergeJsons(user, finalInput)
                // console.log(mergedUserForResponse, 'finalInput')
                let response = await mergedUserForResponse.save()

                const resetLink = `${FE}/reset?token=${token}`
                const MAIL_EMAIL = 'shyam2801951@gmail.com'

                const mailOptions = {
                    from: `Shyam <${MAIL_EMAIL}>`,
                    to: user.email,
                    subject: 'Link to reset password',
                    text: `Blah Blah Blah Blah Blah Blah\n\n ${resetLink}\n\n Blah Blah Blah Blah Blah Blah`
                }
                console.log(response, 'sending email')

                const sendMailResponse = await sendMail(mailOptions)

                console.log('sendMailResponse', JSON.stringify(sendMailResponse))

                return response ? { status: 'success' } : createError('Error occured during update');
            }
            else {
                return createError('User with this email does not exist');
            }
        } catch (e) {
            return createError(e);
        }
    },
    confirmToken: async (_, args) => {
        try {
            let { token } = args
            console.log(token, 'confirmToken')

            let user = await User.findOne({
                resetPasswordToken: token,
                resetPasswordExpiry: {
                    $gt: Date.now()
                }
            })
            return user ? { email: user.email } : createError('No email matches with token')
        } catch (e) {
            return createError(e)
        }
    },
    getUser: async (_, args, context) => {
        try {
            let { email, twitterId, instaId } = args
            let { isValid, decodedContext } = await confirmValidityOfUser({ email, twitterId, instaId }, context)
            if (isValid) {
                const user = await User.findOne(decodedContext);
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
            let { email, twitterId, instaId } = args
            let { isValid, decodedContext } = await confirmValidityOfUser({ email, twitterId, instaId }, context)
            if (isValid) {
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
            let { email, twitterId, instaId } = args
            let { isValid, decodedContext } = await confirmValidityOfUser({ email, twitterId, instaId }, context)
            if (isValid) {
                let userDonations = await UserSaplingDonation.find(decodedContext);
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
            let { email, twitterId, instaId } = args
            let { isValid, decodedContext } = await confirmValidityOfUser({ email, twitterId, instaId }, context)
            if (isValid) {
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