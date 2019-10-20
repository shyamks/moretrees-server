const jwt = require('jsonwebtoken');
// const fs = require('fs')
const lodash = require('lodash')
const nodemailer = require('nodemailer')

const SECRET = "hello"

const EMAIL = 'email'
const TWITTER = 'twitterId'
const INSTA = 'instaId'
const HEROKU_FE = "https://moretrees-client.herokuapp.com"
const LOCAL_FE = 'http://localhost:3000'

const FE = LOCAL_FE

module.exports = {
    EMAIL,
    TWITTER,
    INSTA,
    HEROKU_FE,
    LOCAL_FE,
    FE,
    confirmValidityOfUser: async ({ email, twitterId, instaId }, context) => {
        const verifyToken = (token) => {
            return new Promise((resolve, reject) => {
                jwt.verify(token, SECRET, function (err, decode) {
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
        return jwt.sign({ [type]: id }, SECRET);
    },
    validateRegisterUser: ({ username, password, email }) => {
        let usernameRegex = /^[a-zA-Z0-9]+$/
        let emailRegex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/
        return (usernameRegex.test(username) && emailRegex.test(email) && password.length >= 6)
    },
    sendMail: async (options) => {
        try {

            const EMAIL = '1b9251a279ba95'
            const PASSWORD = '861a10c4fa3a3f'
            const HOST = 'smtp.mailtrap.io'
            const PORT = '2525'
            const emailService = (mailOptions) => (
                new Promise((resolve, reject) => {
                    const transporter = nodemailer.createTransport({
                        host: HOST,
                        port: PORT,
                        auth: {
                            user: `${EMAIL}`,
                            pass: `${PASSWORD}`
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
        // let dbJSONobject = JSON.parse(JSON.stringify(otherKeys));
        // let inputJSONobject = JSON.parse(JSON.stringify(inputObject));
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