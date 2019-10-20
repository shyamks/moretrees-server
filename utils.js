const jwt = require('jsonwebtoken');
const lodash = require('lodash')
const nodemailer = require('nodemailer')
const Razorpay = require('razorpay')
const path = require('path')
const dotenv = require('dotenv')

dotenv.config({ path: path.join(__dirname, `./.env.${process.env.NODE_ENV}`) })

const JWT_SECRET = process.env.JWT_SECRET
const FE = process.env.FRONTEND_URL

const MAILER_EMAIL = process.env.MAILER_EMAIL
const MAILER_PASSWORD = process.env.MAILER_PASSWORD
const MAILER_HOST = process.env.MAILER_HOST
const MAILER_PORT = process.env.MAILER_PORT

const EMAIL = 'email'
const TWITTER = 'twitterId'
const INSTA = 'instaId'

const RAZORPAY_INSTANCE = new Razorpay({
    key_id: process.env.RAZORPAY_KEY,
    key_secret: process.env.RAZORPAY_SECRET
})

module.exports = {
    EMAIL,
    TWITTER,
    INSTA,
    FE,
    RAZORPAY_INSTANCE,
    confirmValidityOfUser: async ({ email, twitterId, instaId }, context) => {
        const verifyToken = (token) => {
            return new Promise((resolve, reject) => {
                jwt.verify(token, JWT_SECRET, function (err, decode) {
                    console.log(`ERROR: ${err}, DECODE: ${JSON.stringify(decode)} VERIFY_TOKEN`)
                    if (err) {
                        reject(err)
                        return
                    }
                    resolve(decode)
                })
            })
        }
        const authorization = context.headers.authorization
        if (authorization) {
            const token = authorization.replace('Bearer ', '')
            const decodedContext = await verifyToken(token)
            const valueFromContext = lodash.omit(decodedContext, ['iat'])
            let isValid = ((JSON.stringify({ email }) === JSON.stringify(valueFromContext)) ||
                (JSON.stringify({ twitterId }) === JSON.stringify(valueFromContext)) ||
                (JSON.stringify({ instaId }) === JSON.stringify(valueFromContext)))
                console.log({ isValid, decodedContext: valueFromContext }, 'auth')
            return { isValid, decodedContext: valueFromContext }
        }

        throw new Error('Not authenticated')
        
    },
    getAccessToken: (type, id) => {
        return jwt.sign({ [type]: id }, JWT_SECRET);
    },
    validateRegisterUser: ({ username, password, email }) => {
        let usernameRegex = /^[a-zA-Z0-9]+$/
        let emailRegex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/
        return (usernameRegex.test(username) && emailRegex.test(email) && password.length >= 6)
    },
    sendMail: async (options) => {
        try {
            const emailService = (mailOptions) => (
                new Promise((resolve, reject) => {
                    const transporter = nodemailer.createTransport({
                        host: MAILER_HOST,
                        port: MAILER_PORT,
                        auth: {
                            user: `${MAILER_EMAIL}`,
                            pass: `${MAILER_PASSWORD}`
                        },
                    })
                    transporter.sendMail(mailOptions, (err, response) => {
                        if (err) {
                            reject(err)
                            return
                        }
                        else {
                            resolve(response)
                        }
                    })
                })
            )

            const emailResponse = await emailService(options)
            return emailResponse
        }
        catch (e) {
            console.log(JSON.stringify(e), 'sendMail error')
            return {error: e, status: 'error'}
        }
    },
    mergeJsons: (dbObject, inputObject) => {
        for (key in inputObject){
            if(inputObject[key] != null)
                dbObject[key] = inputObject[key]
        }
        return dbObject
    },
    prepareObjectForLog: (obj) => {
        return JSON.stringify(obj)
    },
    createError: (object, status = 'error') => {
        return { error: object, status };
    },
    createSuccess: (status = 'success') => {
        return { status };
    }
}