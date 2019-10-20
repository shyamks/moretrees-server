let { EMAIL, FE, getAccessToken, sendMail, confirmValidityOfUser, createError, mergeJsons, prepareObjectForLog } = require('../utils');
let { User, VolunteerOptions, SaplingOptions, UserSaplingDonation } = require('./models')

const crypto = require('crypto')
const winstonLogger = require('../logger')

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
            winstonLogger.info(`Error in query:loginUser =>  ${prepareObjectForLog(e)} `)
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
                    resetPasswordExpiry: Date.now() + 15 * 60 * 1000 // expires in 15 mins
                }

                const mergedUserForResponse = mergeJsons(user, finalInput)
                let response = await mergedUserForResponse.save()

                const resetLink = `${FE}/reset?token=${token}`
                const MAIL_EMAIL = 'shyam2801951@gmail.com'

                const mailOptions = {
                    from: `Shyam <${MAIL_EMAIL}>`,
                    to: user.email,
                    subject: 'Link to reset password',
                    text: `Here's the link to reset your account\n\n ${resetLink}\n\n This link expires in 15 minutes.`
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
            winstonLogger.info(`Error in query:forgotPassword =>  ${prepareObjectForLog(e)} `)
            return createError(e);
        }
    },
    confirmToken: async (_, args) => {
        try {
            let { token } = args

            let user = await User.findOne({
                resetPasswordToken: token,
                resetPasswordExpiry: {
                    $gt: Date.now()
                }
            })
            return user ? { email: user.email } : createError('No email matches with token')
        } catch (e) {
            winstonLogger.info(`Error in query:confirmToken =>  ${prepareObjectForLog(e)} `)
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
            }
            else {
                return createError('User with this email does not exist or the password is incorrect')
            }
        } catch (e) {
            winstonLogger.info(`Error in query:getUser =>  ${prepareObjectForLog(e)} `)
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
            }
            else {
                return createError('User with this email does not exist or the password is incorrect')
            }
        } catch (e) {
            winstonLogger.info(`Error in query:getAllUsers =>  ${prepareObjectForLog(e)} `)
            return createError(e)
        }
    },
    getSaplingOptions: async (_, args, context) => {
        try {
            let { status } = args
            let saplingOptions = await SaplingOptions.find(status ? { status } : {})
            return saplingOptions
        } catch (e) {
            winstonLogger.info(`Error in query:getSaplingOptions =>  ${prepareObjectForLog(e)} `)
            return createError(e)
        }

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
            winstonLogger.info(`Error in query:myDonations =>  ${prepareObjectForLog(e)} `)
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
            winstonLogger.info(`Error in query:getAllUserDonations =>  ${prepareObjectForLog(e)} `)
            return createError(e)
        }
    }

};