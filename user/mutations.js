const mongoose = require('mongoose');

let { EMAIL, RAZORPAY_INSTANCE, confirmValidityOfUser, getAccessToken, createError, mergeJsons, validateRegisterUser, prepareObjectForLog } = require('../utils');
const { User, ProjectDonations, Projects } = require('./models');

const winstonLogger = require('../logger')

module.exports = {
    registerUser: async (_, args) => {
        try {
            const { username, password, email, phone: mobile } = args;
            const user = await User.find({ email: args.email });
            if (!user.length) {
                if (validateRegisterUser({ username, password, email })) {
                    let response = await User.create({ username, password, email, mobile, createdAt: new Date() });
                    response.accessToken = getAccessToken(EMAIL, args.email);
                    return response;
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
    },
    resetPassword: async (_, args, context) => {
        try {
            let { password, confirmPassword, token } = args;
            if (password === confirmPassword && password.length < 20) {
                let user = await User.findOne({
                    resetPasswordToken: token,
                    resetPasswordExpiry: {
                        $gt: Date.now()
                    }
                })
                if (!user) return createError('Email does not exist.');
                let finalInput = { password, resetPasswordToken: '', resetPasswordExpiry: '' }
                const mergedUserForResponse = mergeJsons(user, finalInput)
                console.log(mergedUserForResponse, 'finalInput')
                let response = await mergedUserForResponse.save()
                return response ? { status: 'success' } : createError('Error occured during update')
            }
            return createError('Password and ConfirmPassword not valid')
        } catch (e) {
            winstonLogger.info(`Error in mutations:resetPassword =>  ${prepareObjectForLog(e)} `)
            return createError(e);
        }
    },
    updateUser: async (_, args, context) => {
        try {
            let { input } = args;

            let { username, password, email, phone, volunteerOptions,
                twitterProfile, twitterId, instaProfile, instaId, fbProfile, availableWhen, availableWhat } = input
            let { isValid, decodedContext } = await confirmValidityOfUser({ email, twitterId, instaId }, context)
            if (isValid) {
                console.log(decodedContext,'what here')
                const user = await User.findOne(decodedContext);
                if (!user) return createError('Email does not exist. Please try another email');
                let finalInput = {
                    username, password, phone, volunteerOptions,
                    twitterProfile, instaProfile, fbProfile, availableWhen, availableWhat
                }
                console.log(finalInput, 'finalInput')
                const mergedUserForResponse = mergeJsons(user, finalInput)
                let response = await mergedUserForResponse.save()
                return response ? response : createError('Error occured during update')
            }
            return createError('Email not valid')
        } catch (e) {
            winstonLogger.info(`Error in mutations:updateUser =>  ${prepareObjectForLog(e)} `)
            return createError(e);
        }
    },
    updateUsers: async (_, args, context) => {
        try {
            let { input, email: emailFromRequest, twitterId, instaId } = args;
            let { isValid, decodedContext } = await confirmValidityOfUser({ email: emailFromRequest, twitterId, instaId }, context)
            if (isValid) {
                const isAdminUserCheck = await User.findOne(decodedContext)
                if (isAdminUserCheck.type == 'admin') {
                    for (let i = 0; i < input.length; i++) {
                        let { username, password, email, phone, volunteerOptions,
                            twitterProfile, twitterId, instaProfile, instaId, fbProfile, availableWhen, availableWhat } = input[i]
                        let queryObject = email && { email } || twitterId && { twitterId } || instaId && { instaId }
                        const user = await User.findOne(queryObject);
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
                    const users = await User.find({})
                    return { response: users, status: 'success' }
                }
                return createError('User not the boss. Bye')
            }
            return createError('Email not valid')
        } catch (e) {
            winstonLogger.info(`Error in mutations:updateUsers =>  ${prepareObjectForLog(e)} `)
            return createError(e);
        }
    },
    makeDonation: async (_, args, context) => {
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
                let projects = await Projects.find({ status: 'ACTIVE' })
                let projectItems = items;

                let projectsMap = projects.reduce((map, object) => {
                    map[object.id] = object
                    return map
                }, {})

                let canTransactionHappen = projectItems.map(projectItem => {
                    let projectOptionItem = projectsMap[projectItem.id]
                    if (projectOptionItem.remaining >= projectItem.count) {
                        return true
                    }
                    return false
                }).reduce((finalValue, booleanValue) => booleanValue && finalValue, true)
                if (!canTransactionHappen) {
                    winstonLogger.info(`Error in transaction => ${prepareObjectForLog({ error: 'Not enough saplings left to make a donation' })}  `)
                    return createError('Not enough saplings left to make a donation')
                }
                if (!token) {
                    winstonLogger.info(`Error in transaction => ${prepareObjectForLog({ error: 'Token not present in the input' })}  `)
                    return createError('Token not present in the input');
                }
                else {
                    const bulkWriteProjects = async (projectItems, projectsMap) => {
                        let updatedProjectItemsOperations = projectItems.map(projectItem => {
                            let projectOptionItem = projectsMap[projectItem.id]
                            if (projectOptionItem) {
                                projectOptionItem.remaining -= projectItem.count
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
                            // console.log(JSON.stringify(updatedProjectItemsOperations),'operation before')
                            operationResult = await Projects.bulkWrite(updatedProjectItemsOperations)
                            // console.log(operationResult, updatedProjectItemsOperations,'operation bulk')
                        }
                        return operationResult;
                    }
                    Project
                    let charge, bulkWriteResult
                    try {
                        charge = await RAZORPAY_INSTANCE.payments.capture(finalToken, finalAmount, 'INR')
                    }
                    catch (e) {
                        console.log(e, 'charges problem')
                        winstonLogger.info('Transaction UNSUCCESSFULL', e)
                        return createError('Problem during transaction.')
                    }

                    if (projectItems.length) {
                        bulkWriteResult = await bulkWriteProjects(projectItems, projectsMap)
                    }

                    let createSaplingDonationResult = await ProjectDonations.create({ email, token, amount, items, paymentDetails: charge })

                    console.log(createSaplingDonationResult, 'yeyeyey')
                    let returnValue = { status: 'success', referenceId: createSaplingDonationResult.id }
                    winstonLogger.info(`Transaction SUCCESSFULL => ${prepareObjectForLog({ ...returnValue, ...createSaplingDonationResult })} `)
                    return returnValue
                }
            }
        } catch (e) {
            winstonLogger.info(`Error in transaction =>  ${prepareObjectForLog(e)} `)
            return createError(e);
        }
    },
    updateSaplings: async (_, args, context) => {
        try {
            let { input, email: emailFromRequest, twitterId, instaId } = args;
            let { isValid, decodedContext } = await confirmValidityOfUser({ email: emailFromRequest, twitterId, instaId }, context)
            if (isValid) {
                const user = await User.findOne(decodedContext)
                if (user.type == 'admin'){
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
                            const mergedSapling = mergeJsons(sapling, finalInput)
                            let response = await mergedSapling.save()
                            if (!response) createError('Error occured during update')
                        }
                    }
                    const saplings = await Projects.find({ })
                    return { response: saplings, status: 'success' }
                }
                return createError('User not admin. Sneaky.')
                
            }
            return createError('Email not valid')
        } catch (e) {
            winstonLogger.info(`Error in mutations:updateSaplings =>  ${prepareObjectForLog(e)} `)
            return createError(e);
        }
    },
};