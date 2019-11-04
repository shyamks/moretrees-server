import jwt from 'jsonwebtoken'
import lodash from 'lodash'
import nodemailer from 'nodemailer'
import Razorpay from 'razorpay'
import path from 'path'
import dotenv from 'dotenv'
import { CounterInterface, Counters, UserInterface, ProjectInterface, UserDonationInterface } from './user/models'

const envFile = path.join(__dirname, `./.env.${process.env.NODE_ENV}`)
dotenv.config({ path: envFile })

const MAILER_EMAIL = process.env.MAILER_EMAIL
const MAILER_PASSWORD = process.env.MAILER_PASSWORD
const MAILER_HOST = process.env.MAILER_HOST
const MAILER_PORT = process.env.MAILER_PORT


export const JWT_SECRET: string = process.env.JWT_SECRET || 'hello'
export const FE = process.env.FRONTEND_URL

export const EMAIL = 'email'
export const TWITTER = 'twitterId'
export const INSTA = 'instaId'

export const RAZORPAY_INSTANCE = new Razorpay({
    key_id: process.env.RAZORPAY_KEY,
    key_secret: process.env.RAZORPAY_SECRET
})


export const confirmValidityOfUser = async ({ email, twitterId, instaId }: { email: String, twitterId: String, instaId: String }, context: any) => {
    const verifyToken = (token: string) => {
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
        const decodedContext: any = await verifyToken(token)
        const valueFromContext = lodash.omit(decodedContext, ['iat'])
        let isValid = ((JSON.stringify({ email }) === JSON.stringify(valueFromContext)) ||
            (JSON.stringify({ twitterId }) === JSON.stringify(valueFromContext)) ||
            (JSON.stringify({ instaId }) === JSON.stringify(valueFromContext)))
        console.log({ isValid, decodedContext: valueFromContext }, 'auth')
        return { isValid, decodedContext: valueFromContext }
    }

    throw new Error('Not authenticated')

}

export const getAccessToken = (type: string, id: any) => {
    return jwt.sign({ [type]: id }, JWT_SECRET);
}

export const getNextId = async (collectionName: String) => {
    let counterForCollection: CounterInterface | null = await Counters.findOne({ collectionName })
    if (!counterForCollection){
      throw new Error('Cannot fetch the nextId for the collection')
    }
    counterForCollection.counterValue += 1
    let response = counterForCollection.save()
    if (response)
      return counterForCollection.counterValue
    throw new Error('Error when saving the nextId for the collection')
  }

export const validateRegisterUser = ({ username, password, email }: { username: string, password: string, email: string }) => {
    let usernameRegex = /^[a-zA-Z0-9]+$/
    let emailRegex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/
    return (usernameRegex.test(username) && emailRegex.test(email) && password.length >= 6)
}

export const sendMail = async (options: any) => {
    const transportOptions: any = {
        host: MAILER_HOST,
        port: MAILER_PORT,
        auth: {
            user: `${MAILER_EMAIL}`,
            pass: `${MAILER_PASSWORD}`
        },
    }
    try {
        const emailService = (mailOptions: any) => (
            new Promise((resolve, reject) => {
                const transporter = nodemailer.createTransport(transportOptions)
                transporter.sendMail(mailOptions, (err: any, response: any) => {
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
        return { error: e, status: 'error' }
    }
}

export const prepareDonationResponseItem = (projectId: string, user: UserInterface, allProjectsMap : Map<String, ProjectInterface>, userDonation: UserDonationInterface) => {
    let project: ProjectInterface | undefined = allProjectsMap.get(String(projectId))
    if (!project || !user) {
        throw new Error('Project/User does not exist')
    }
    let { email, instaProfile, twitterProfile } = user
    let { type, title, subtitle, cost, content } = project
    let { treeId, status, createdAt, photoTimeline } = userDonation
    return {
        email,
        instaProfile,
        twitterProfile,
        type,
        title,
        subtitle,
        cost,
        content,
        treeId,
        status,
        createdAt,
        photoTimeline
    }
}

export const mergeJsons = (dbObject: any, inputObject: any) => {
    for (const key in inputObject) {
        if (inputObject[key] != null)
            dbObject[key] = inputObject[key]
    }
    return dbObject
}

export const prepareObjectForLog = (obj: any) => {
    return JSON.stringify(obj)
}

export const createError = (object: any, status = 'error') => {
    return { responseStatus : { text: object, status }};
}

export const prepareResponse = (object: any, key: string | null = null) => {
    return key ? { responseStatus: { text: 'success', status: 'success' }, [key]: object }
                : { responseStatus: { text: 'success', status: 'success' }, ...object}
}

export const createSuccess = (status = 'success') => {
    return { status };
}

export function getMapFromArray<T>(inputArray: T[], indexKey: keyof T): Map<String, T> {
    const normalizedObject: Map<String, T> = new Map<String, T>()
    for (let i = 0; i < inputArray.length; i++) {
        const key = inputArray[i][indexKey]
        normalizedObject.set(String(key), inputArray[i])
    }
    return normalizedObject
}