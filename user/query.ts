import mongoose from 'mongoose'
import crypto from 'crypto'
import bcrypt from 'bcrypt'

import { EMAIL, FE, getAccessToken, sendMail, confirmValidityOfUser, createError, mergeJsons, prepareObjectForLog, getMapFromArray, prepareDonationResponseItem, prepareResponse } from '../utils'
import { Users, Projects, UserInterface, UserDonations, UserDonationInterface, ProjectInterface } from './models'
import winstonLogger from '../logger'


const ObjectId = mongoose.Types.ObjectId

export const isEmailAvailable = async (_: any, args: any) => {
    try {
        let user: UserInterface | null = await Users.findOne({ email: args.email });
        return prepareResponse({ email: args.email, emailAvailable: !user })
    } catch (e) {
        winstonLogger.info(`Error in query:emailAvailable =>  ${prepareObjectForLog(e)} `)
        return createError(e);
    }
}
export const loginUser = async (_: any, args: any) => {
    try {
        let user: UserInterface | null = await Users.findOne({ email: args.email });
        if (user && bcrypt.compareSync(args.password, user.password) ) {
            user.accessToken = getAccessToken(EMAIL, args.email);
            return prepareResponse(user.toObject());
        }
        else {
            return createError('User with this email does not exist or the password is incorrect');
        }
    } catch (e) {
        winstonLogger.info(`Error in query:loginUser =>  ${prepareObjectForLog(e)} `)
        return createError(e);
    }
}
export const forgotPassword = async (_: any, args: any) => {
    try {
        let user = await Users.findOne({ email: args.email });
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

            return response ? prepareResponse({ status: 'success' }) : createError('Error occured during update');
        }
        else {
            return createError('User with this email does not exist');
        }
    } catch (e) {
        winstonLogger.info(`Error in query:forgotPassword =>  ${prepareObjectForLog(e)} `)
        return createError(e);
    }
}
export const confirmToken = async (_: any, args: any) => {
    try {
        let { token } = args

        let user = await Users.findOne({
            resetPasswordToken: token,
            resetPasswordExpiry: {
                $gt: Date.now()
            }
        })
        return user ? prepareResponse({ email: user.email }) : createError('No email matches with token')
    } catch (e) {
        winstonLogger.info(`Error in query:confirmToken =>  ${prepareObjectForLog(e)} `)
        return createError(e)
    }
}
export const getUser = async (_: any, args: any, context: any) => {
    try {
        let { email, twitterId, instaId } = args
        let { isValid, decodedContext } = await confirmValidityOfUser({ email, twitterId, instaId }, context)
        if (isValid) {
            const user: UserInterface | null = await Users.findOne(decodedContext);
            return user ? prepareResponse(user.toObject()) : createError('User with this email does not exist or the password is incorrect')
        }
        else {
            return createError('User with this email does not exist or the password is incorrect')
        }
    } catch (e) {
        winstonLogger.info(`Error in query:getUser =>  ${prepareObjectForLog(e)} `)
        return createError(e)
    }
}
export const getAllUsers = async (_: any, args: any, context: any) => {
    try {
        let { email, twitterId, instaId } = args
        let { isValid, decodedContext } = await confirmValidityOfUser({ email, twitterId, instaId }, context)
        if (isValid) {
            let users = await Users.find({});
            return prepareResponse(users, 'users')
        }
        else {
            return createError('User with this email does not exist or the password is incorrect')
        }
    } catch (e) {
        winstonLogger.info(`Error in query:getAllUsers =>  ${prepareObjectForLog(e)} `)
        return createError(e)
    }
}
export const getProjects = async (_: any, args: any, context: any) => {
    try {
        let { status } = args
        let projects = await Projects.find(status ? { status } : {})
        return prepareResponse(projects, 'projects')
    } catch (e) {
        winstonLogger.info(`Error in query:getProjects =>  ${prepareObjectForLog(e)} `)
        return createError(e)
    }

}

export type MyDonationsResponse = {
    type: string,
    title: string,
    subtitle: string,
    cost: string,
    content: string,
    treeId: number,
    status: string,
    createdAt: Date,
    photoTimeline?: PhotoTimeline[]
}
type PhotoTimeline = {
    text: string,
    photoUrl: string
}
export const myDonations = async (_: any, args: any, context: any) => {
    try {
        let { email, twitterId, instaId } = args
        let { isValid, decodedContext } = await confirmValidityOfUser({ email, twitterId, instaId }, context)
        if (isValid) {
            const user: UserInterface | null = await Users.findOne(decodedContext)
            if (!user)
                throw new Error('User does not exist')
            // const donationPaymentInfo: ProjectDonationsPaymentInfoInterface[] = await ProjectDonationsPaymentInfo.find({ userId: user.id });
            const userDonations: UserDonationInterface[] = await UserDonations.find({ userId: user.id })
            const allProjects: ProjectInterface[] = await Projects.find({})
            const allProjectsMap: Map<String, ProjectInterface> = getMapFromArray(allProjects, '_id')
            let myDonationsResponse: MyDonationsResponse[] = userDonations.map((userDonation: UserDonationInterface) => {
                return prepareDonationResponseItem(userDonation.projectId, user, allProjectsMap, userDonation)
            })
            return prepareResponse(myDonationsResponse, 'myDonations')
        }
        else {
            return createError('User with this email does not exist or the password is incorrect')
        }
    } catch (e) {
        console.log(e)
        winstonLogger.info(`Error in query:myDonations =>  ${prepareObjectForLog(e)} `)
        return createError(e)
    }
}
export const getAllUserDonations = async (_: any, args: any, context: any) => {
    try {
        let { email, twitterId, instaId } = args
        let { isValid, decodedContext } = await confirmValidityOfUser({ email, twitterId, instaId }, context)
        if (isValid) {
            
            const allProjects: ProjectInterface[] = await Projects.find({})
            const allProjectsMap: Map<String, ProjectInterface> = getMapFromArray(allProjects, '_id')

            const allUserDonations: UserDonationInterface[] = await UserDonations.find({})
            const allUserIds: mongoose.Types.ObjectId[] = allUserDonations.reduce((array: string[], userDonation: UserDonationInterface) => {
                let userId = userDonation.userId
                if (!array.includes(userId))
                    return [...array, userId]
                return array
            }, []).map((userId: string) => mongoose.Types.ObjectId(userId))

            const allUsersForDonation: UserInterface[] = await Users.find({ _id: { $in: allUserIds } })
            const allUsersForDonationMap: Map<String, UserInterface> = getMapFromArray(allUsersForDonation, '_id')

            let allDonationsResponse: MyDonationsResponse[] = allUserDonations.map((userDonation: UserDonationInterface) => {
                let user: UserInterface | undefined = allUsersForDonationMap.get(String(userDonation.userId))
                if (user)
                    return prepareDonationResponseItem(userDonation.projectId, user, allProjectsMap, userDonation)
                else {
                    throw new Error('Project/User does not exist')
                }
            })
            return prepareResponse(allDonationsResponse, 'allDonations')
        }
        else {
            return createError('User with this email does not exist or the password is incorrect')
        }
    } catch (e) {
        console.log(e)
        winstonLogger.info(`Error in query:getAllUserDonations =>  ${prepareObjectForLog(e)} `)
        return createError(e)
    }
}