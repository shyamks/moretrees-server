import mongoose from 'mongoose'
import lodash from 'lodash'
import bcrypt from 'bcrypt'

import { EMAIL, RAZORPAY_INSTANCE, confirmValidityOfUser, getAccessToken, createError, mergeJsons, getNextId, validateRegisterUser, prepareObjectForLog, getMapFromArray, prepareDonationResponseItem, prepareResponse, HASHING_ROUNDS } from '../utils'
import { ProjectDonationsPaymentInfo, Projects, ProjectInterface, DonationItemInterface, UserDonations, UserDonationInterface, UserInterface, Users, COLLECTION_NAME, ProjectDonationsPaymentInfoInterface, PhotoTimelineInterface } from './models'

import winstonLogger from '../logger'
import { MyDonationsResponse } from './query'

export const registerUser = async (_: any, args: any) => {
    try {
        const { username, password, email, phone: mobile } = args;
        const user = await Users.find({ email: args.email });
        if (!user.length) {
            if (validateRegisterUser({ username, password, email })) {
                let hashedPassword = bcrypt.hashSync(password, HASHING_ROUNDS)
                let response: UserInterface = await Users.create({ username, password: hashedPassword, email, mobile, createdAt: new Date() });
                response.accessToken = getAccessToken(EMAIL, args.email);
                return prepareResponse(response.toObject());
            }
            else {
                return createError('Please type in valid details', 'input error');
            }
        }
        else {
            return createError('Email already exists. Please try another email');
        }
    } catch (e) {
        winstonLogger.info(`Error in mutations:registerUser =>  ${prepareObjectForLog(e)} `)
        return createError(e);
    }
}

export const resetPassword = async (_: any, args: any, context: any) => {
    try {
        let { password, confirmPassword, token } = args;
        if (password === confirmPassword) {
            let user: UserInterface | null= await Users.findOne({
                resetPasswordToken: token,
                resetPasswordExpiry: {
                    $gt: Date.now()
                }
            })
            if (!user) return createError('Email does not exist.');
            let hashedPassword = bcrypt.hashSync(password, HASHING_ROUNDS)
            let finalInput = { password: hashedPassword, resetPasswordToken: '', resetPasswordExpiry: '' }
            const mergedUserForResponse = mergeJsons(user, finalInput)
            console.log(mergedUserForResponse, 'finalInput')
            let response = await mergedUserForResponse.save()
            return response ? prepareResponse({ status: 'success' }) : createError('Error occured during update')
        }
        return createError('Password and ConfirmPassword not valid')
    } catch (e) {
        winstonLogger.info(`Error in mutations:resetPassword =>  ${prepareObjectForLog(e)} `)
        return createError(e);
    }
}

export const updateUser = async (_: any, args: any, context: any) => {
    try {
        let { input } = args;

        let { username, password, email, phone, volunteerOptions,
            twitterProfile, twitterId, instaProfile, instaId, fbProfile, availableWhen, availableWhat } = input
        let { isValid, decodedContext } = await confirmValidityOfUser({ email, twitterId, instaId }, context)
        if (isValid) {
            console.log(decodedContext, 'what here')
            const user = await Users.findOne(decodedContext);
            if (!user) return createError('Email does not exist. Please try another email');
            let hashedPassword = bcrypt.hashSync(password, HASHING_ROUNDS)
            let finalInput = {
                username, password: hashedPassword, phone, volunteerOptions,
                twitterProfile, instaProfile, fbProfile, availableWhen, availableWhat
            }
            console.log(finalInput, 'finalInput')
            const mergedUserForResponse = mergeJsons(user, finalInput)
            let response: UserInterface  = await mergedUserForResponse.save()
            return response ? prepareResponse(response.toObject()) : createError('Error occured during update')
        }
        return createError('Email not valid')
    } catch (e) {
        winstonLogger.info(`Error in mutations:updateUser =>  ${prepareObjectForLog(e)} `)
        return createError(e);
    }
}

export const updateUsers = async (_: any, args: any, context: any) => {
    try {
        let { input, email: emailFromRequest, twitterId, instaId } = args;
        let { isValid, decodedContext } = await confirmValidityOfUser({ email: emailFromRequest, twitterId, instaId }, context)
        if (isValid) {
            const isAdminUser: UserInterface | null = await Users.findOne(decodedContext)
            if (isAdminUser && isAdminUser.type == 'admin') {
                for (let i = 0; i < input.length; i++) {
                    let { username, password, email, phone, volunteerOptions,
                        twitterProfile, twitterId, instaProfile, instaId, fbProfile, availableWhen, availableWhat } = input[i]
                    let queryObject = email && { email } || twitterId && { twitterId } || instaId && { instaId }
                    const user = await Users.findOne(queryObject);
                    if (!user) return createError('One of the emails do not exist. Please try another email');
                    let finalInput = {
                        username, password, phone, volunteerOptions,
                        twitterProfile, instaProfile, fbProfile, availableWhen, availableWhat
                    }
                    console.log(finalInput, 'finalInput')
                    const mergedUserForResponse = mergeJsons(user, finalInput)
                    let response = await mergedUserForResponse.save()
                    if (!response) createError('Error occured during update')
                }
                const users = await Users.find({})
                return prepareResponse(users, 'response')
            }
            return createError('User not the boss. Bye')
        }
        return createError('Email not valid')
    } catch (e) {
        winstonLogger.info(`Error in mutations:updateUsers =>  ${prepareObjectForLog(e)} `)
        return createError(e);
    }
}

export const makeDonation = async (_: any, args: any, context: any) => {
    try {

        let { input } = args
        let { email, twitterId, instaId, token, amount, items } = input
        let { isValid, decodedContext } = await confirmValidityOfUser({ email, twitterId, instaId }, context)
        if (isValid) {
            winstonLogger.info(`makeDonation request args => ${prepareObjectForLog(args)}`)

            let finalToken = token
            let finalAmount = amount * 100;

            if (finalAmount < 50 * 100)
                return createError('Final amount is below Rs 50')
            let projectItems: DonationItemInterface[] = items.map((item: any) => (
                {
                    projectId: item.id,
                    title: item.title,
                    count: item.count
                }
            ));

            let projects: ProjectInterface[] = await Projects.find({ status: 'ACTIVE' })
            let projectsMap: Map<String, ProjectInterface> = getMapFromArray(projects, '_id')

            let canTransactionHappen: boolean = projectItems.map((projectItem: DonationItemInterface) => {
                let projectOptionItem: ProjectInterface | undefined = projectsMap.get(String(projectItem.projectId))
                if (projectOptionItem && projectOptionItem.remaining >= projectItem.count) {
                    return true
                }
                return false
            }).reduce((finalValue: boolean, booleanValue: boolean) => booleanValue && finalValue, true)
            if (!canTransactionHappen) {
                winstonLogger.info(`Error in transaction => ${prepareObjectForLog({ error: 'Not enough saplings left to make a donation' })}  `)
                return createError('Not enough saplings left to make a donation')
            }
            if (!token) {
                winstonLogger.info(`Error in transaction => ${prepareObjectForLog({ error: 'Token not present in the input' })}  `)
                return createError('Token not present in the input');
            }
            else {
                const bulkWriteProjects = async (projectItems: DonationItemInterface[], projectsMap: Map<String, ProjectInterface>) => {
                    let updatedProjectItemsOperations = projectItems.map((projectItem: DonationItemInterface)=> {
                        let projectOptionItem: ProjectInterface | undefined = projectsMap.get(projectItem.projectId)
                        if (projectOptionItem) {
                            let newRemainingCount: number = projectOptionItem.remaining - projectItem.count
                            projectOptionItem.remaining = newRemainingCount
                            // updating remaining based on title 
                            return {
                                updateOne: {
                                    filter: { title: projectOptionItem.title },
                                    update: { $set: { remaining: projectOptionItem.remaining } }
                                }
                            }
                        }
                        return null
                    }).filter(item => item)
                    let operationResult
                    if (updatedProjectItemsOperations.length) {
                        operationResult = await Projects.bulkWrite(updatedProjectItemsOperations)
                    }
                    return operationResult;
                }
                const user: UserInterface | null = await Users.findOne(decodedContext)
                if (!user)
                    throw new Error('User does not exist')
                // console.log(user,'user')
                const userDonations = projectItems.reduce((donations: any, projectItem: DonationItemInterface) => {
                    let project: ProjectInterface | undefined = projectsMap.get(projectItem.projectId)
                    if (project) {
                        let { id } = project
                        let userDonations = lodash.times(projectItem.count, () => {
                            let userDonationObject = {
                                userId: user.id,
                                status: 'PENDING',
                                projectId: id,
                                createdAt: new Date()
                            }
                            return userDonationObject
                        })
                        return [...donations, ...userDonations]
                    }
                    return donations
                }, [])
                for (let i = 0; i < userDonations.length; i++) {
                    let nextId = await getNextId(COLLECTION_NAME.USER_DONATIONS)
                    let response: UserDonationInterface = await UserDonations.create({ ...userDonations[i], treeId: nextId })
                }
                let charge, bulkWriteResult

                if (projectItems.length) {
                    bulkWriteResult = await bulkWriteProjects(projectItems, projectsMap)
                }
                try {
                    charge = await RAZORPAY_INSTANCE.payments.capture(finalToken, finalAmount, 'INR')
                }
                catch (e) {
                    console.log(e, 'charges problem')
                    winstonLogger.info('Transaction UNSUCCESSFULL', e)
                    return createError('Problem during transaction.')
                }

                let donationPaymentResult: ProjectDonationsPaymentInfoInterface = await ProjectDonationsPaymentInfo.create({ userId: user.id, token, amount, items, paymentDetails: charge })

                console.log(donationPaymentResult, 'yeyeyey')
                let returnValue = { status: 'success', referenceId: donationPaymentResult.id }
                winstonLogger.info(`Transaction SUCCESSFULL => ${prepareObjectForLog({ ...returnValue, ...donationPaymentResult })} `)
                return prepareResponse(returnValue)
            }
        }
    } catch (e) {
        console.log(`Error in transaction =>  ${prepareObjectForLog(e)} `)
        winstonLogger.info(`Error in transaction =>  ${prepareObjectForLog(e)} `)
        return createError(e);
    }
}

export const updateUserDonations = async (_: any, args: any, context: any) => {
    try {
        let { input, email: emailFromRequest, twitterId, instaId } = args;
        let { isValid, decodedContext } = await confirmValidityOfUser({ email: emailFromRequest, twitterId, instaId }, context)
        if (!isValid)
            return createError('User not valid')
        const user: UserInterface | null = await Users.findOne(decodedContext)
        const allProjects: ProjectInterface[] = await Projects.find({})
        const allProjectsMap: Map<String, ProjectInterface> = getMapFromArray(allProjects, '_id')
        if (!user)
            return createError('User does not exit.')
        if (user.type != 'admin')
            return createError('User not admin. Sneaky.')
        // update user donations
        for (let i = 0; i < input.length; i++) {
            let { treeId, status } = input[i]
            const userDonation: UserDonationInterface | null = await UserDonations.findOne({ treeId })
            if (!userDonation)
                return createError('Tree does not exist.')
            const userFromDonation: UserInterface | null = await Users.findOne({ _id: userDonation.userId })
            if (!userFromDonation)
                return createError('User from donation does not exist.')
            userDonation.status = status
            let response = await userDonation.save()
            if (!response) createError('Error occured during update')
        }
        // get allUserDonations response

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
    } catch (e) {
        console.log(e)
        winstonLogger.info(`Error in mutations:updateUserDonations =>  ${prepareObjectForLog(e)} `)
        return createError(e);
    }
}

export const addPhotoToTimeline = async (_: any, args: any, context: any) => {
    try {
        let { input, email: emailFromRequest, twitterId, instaId } = args;
        let { isValid, decodedContext } = await confirmValidityOfUser({ email: emailFromRequest, twitterId, instaId }, context)
        if (!isValid)
            return createError('User not valid')
        const user: UserInterface | null = await Users.findOne(decodedContext)
        const allProjects: ProjectInterface[] = await Projects.find({})
        const allProjectsMap: Map<String, ProjectInterface> = getMapFromArray(allProjects, '_id')
        if (!user)
            return createError('User does not exit.')
        if (user.type != 'admin')
            return createError('User not admin. Sneaky.')
        let { treeId, isNewPhoto, text, link, order } = input
        const userDonation: UserDonationInterface | null = await UserDonations.findOne({ treeId })
        if (!userDonation)
            return createError('Tree does not exist.')
        const userFromDonation: UserInterface | null = await Users.findOne({ _id: userDonation.userId })
        if (!userFromDonation)
            return createError('User from donation does not exist.')
        let changedPhotoTimeline: PhotoTimelineInterface[] | undefined = userDonation.photoTimeline
        if (isNewPhoto) {
            if (changedPhotoTimeline) { //another photo to existing timeline
                changedPhotoTimeline.push({ text, photoUrl: link, order: changedPhotoTimeline.length + 1 })
            }
            else { // first photo to timeline
                changedPhotoTimeline = [{ text, photoUrl: link, order: 1 }]
            }
        }
        else {
            if (changedPhotoTimeline) {
                changedPhotoTimeline = changedPhotoTimeline.map((item: PhotoTimelineInterface) => {
                    if (item.order === order) {
                        item.photoUrl = link
                        item.text = text
                    }
                    return item
                })
            }
        }
        userDonation.status = "PLANTED"
        userDonation.photoTimeline = changedPhotoTimeline
        let response = await userDonation.save()
        return response ? prepareResponse(prepareDonationResponseItem(userDonation.projectId, userFromDonation, allProjectsMap, userDonation), 'myDonation') : createError('error aagide')

    } catch(e) {
        console.log(e)
        winstonLogger.info(`Error in mutations:addPhotoToTimeline =>  ${prepareObjectForLog(e)} `)
        return createError(e);
    }
}

export const updateProjects = async (_: any, args: any, context: any) => {
    try {
        let { input, email: emailFromRequest, twitterId, instaId } = args;
        let { isValid, decodedContext } = await confirmValidityOfUser({ email: emailFromRequest, twitterId, instaId }, context)
        if (isValid) {
            const user: UserInterface | null = await Users.findOne(decodedContext)
            if (user && user.type == 'admin') {
                for (let i = 0; i < input.length; i++) {
                    let { id, status, type, title, subtitle, cost, content, remaining, createNewRow, removeRow } = input[i]
                    if (createNewRow && id) {
                        let createResponse = await Projects.create({ status, type, title, subtitle, cost, content, remaining })
                        if (!createResponse) createError('Error occured during creating')
                    }
                    else if (removeRow && id) {
                        let deleteResponse = await Projects.deleteOne({ _id: new mongoose.Types.ObjectId(id) })
                        if (!deleteResponse) createError('Error occured during remove')
                    }
                    else {
                        const sapling = await Projects.findOne({ _id: new mongoose.Types.ObjectId(id) });
                        if (!sapling) return createError('Sapling does not exist');
                        let finalInput = { status, type, title, subtitle, cost, content, remaining }
                        console.log(finalInput, 'finalInput')
                        const mergerdProject = mergeJsons(sapling, finalInput)
                        let response = await mergerdProject.save()
                        if (!response) createError('Error occured during update')
                    }
                }
                const saplings = await Projects.find({})
                return prepareResponse({ response: saplings, status: 'success' })
            }
            return createError('User not admin. Sneaky.')

        }
        return createError('Email not valid')
    } catch (e) {
        winstonLogger.info(`Error in mutations:updateProjects =>  ${prepareObjectForLog(e)} `)
        return createError(e);
    }
}