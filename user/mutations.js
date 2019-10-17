const lodash = require('lodash')
const mongoose = require('mongoose');

let { getAccessToken, createError, createSuccess, mergeJsons, getEmailFromContext, validateRegisterUser, prepareObjectForLog } = require('../utils');
const { User, VolunteerOptions, UserSaplingDonation, SaplingOptions } = require('./models');
const Razorpay = require('razorpay')

const winstonLogger = require('../logger')

const razorpayInstance = new Razorpay({
    key_id: 'rzp_test_cxpMW5qj3FfIZD',
    key_secret: 'B3AunkV7bOzjYdzIUHPFGtVc'
})
module.exports = {
    registerUser: async (_, args) => {
        try {
            const { username, password, email, phone: mobile } = args;
            const user = await User.find({ email: args.email });
            if (!user.length) {
                if (validateRegisterUser({ username, password, email })) {
                    let response = await User.create({ username, password, email, mobile, createdAt: new Date() });
                    response.accessToken = getAccessToken(args.email);
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
            return createError(e);
        }
    },
    updateUser: async (_, args, context) => {
        try {
            let { input } = args;

            let { username, password, email, phone, volunteerOptions, twitterProfile, instaProfile, fbProfile, availableWhen, availableWhat } = input
            let emailFromToken = await getEmailFromContext(context)
            console.log(args, 'args')
            if (email === emailFromToken) {
                const user = await User.findOne({ email });
                if (!user) return createError('Email does not exist. Please try another email');
                let finalInput = { username, password, phone, volunteerOptions, twitterProfile, instaProfile, fbProfile, availableWhen, availableWhat }
                console.log(finalInput, 'finalInput')
                const mergedUserForResponse = mergeJsons(user, finalInput)
                let response = await mergedUserForResponse.save()
                return response ? response : createError('Error occured during update')
            }
            return createError('Email not valid')
        } catch (e) {
            console.log(e,'e')
            return createError(e);
        }
    },
    updateUsers: async (_, args, context) => {
        try {
            let { input, email: emailFromRequest } = args;
            let emailFromToken = await getEmailFromContext(context)
            if (emailFromRequest === emailFromToken) {
                const isAdminUserCheck = await User.findOne({ email: emailFromRequest })
                if (isAdminUserCheck.type == 'admin'){
                    for (let i = 0; i < input.length; i++) {
                        let { username, password, email, phone, volunteerOptions, twitterProfile, instaProfile, fbProfile, availableWhen, availableWhat } = input[i]
                        const user = await User.findOne({ email });
                        if (!user) return createError('One of the emails do not exist. Please try another email');
                        let finalInput = { username, password, phone, volunteerOptions, twitterProfile, instaProfile, fbProfile, availableWhen, availableWhat }
                        console.log(finalInput, 'finalInput')
                        const mergedUserForResponse = mergeJsons(user, finalInput)
                        let response = await mergedUserForResponse.save()
                        if (!response) createError('Error occured during update')
                    }
                    const users = await User.find({ })
                    return { response: users, status: 'success' }
                }
                return createError('User not the boss. Bye')
            }
            return createError('Email not valid')
        } catch (e) {
            console.log(e,'e')
            return createError(e);
        }
    },
    makePayment: async (_, args, context) => {
        try {

            let { email, token, amount } = args
            let emailFromToken = await getEmailFromContext(context)
            if (email === emailFromToken) {

                let finalToken = token
                let finalAmount = amount * 100;
                // // console.log(finalToken, 'tokeeeee')
                // let charge = await stripe.charges.create({
                //     amount: finalAmount,
                //     currency: 'inr',
                //     description: 'Example charge',
                //     source: finalToken,
                // });

                // console.log(JSON.stringify(charge), 'yeyeyey')
                return { status: 'success' }
            }
        } catch (e) {
            console.log(e, 'wtf')
            return createError(e);
        }
    },
    makeDonation: async (_, args, context) => {
        try {

            let { input } = args
            // console.log('inupt', args)
            let { email, token, amount, items } = input
            // let emailFromToken = await getEmailFromContext(context)
            // if (email === emailFromToken) {  
            winstonLogger.info(`makeDonation request args => ${prepareObjectForLog(args)}`)

            let finalToken = token
            let finalAmount = amount * 100;
            
            if (finalAmount < 50 * 100)
                return createError('Final amount is below Rs 50')
            let saplingOptions = await SaplingOptions.find({ status: 'ACTIVE' })
            let saplingItems = items;

            // console.log(saplingItems,saplingOptions,'saaaaaa')
            let saplingOptionsMap = saplingOptions.reduce((map, object) => {
                map[object.id] = object
                return map
            }, {})

            let canTransactionHappen = saplingItems.map(saplingItem => {
                let saplingOptionItem = saplingOptionsMap[saplingItem.id]
                if (saplingOptionItem.remaining >= saplingItem.count) {
                    return true
                }
                return false
            }).reduce((finalValue, booleanValue) => booleanValue && finalValue, true)
            // console.log(canTransactionHappen, 'tokeeeee')
            if (!canTransactionHappen) {
                winstonLogger.info(`Error in transaction => ${prepareObjectForLog({ error: 'Not enough saplings left to make a donation' })}  `)
                return createError('Not enough saplings left to make a donation')
            }
            if (!token) {
                winstonLogger.info(`Error in transaction => ${prepareObjectForLog({ error: 'Token not present in the input' })}  `)
                return createError('Token not present in the input');
            }
            else {
                const bulkWriteSaplingOptions = async (saplingItems, saplingOptionsMap) => {
                    let updatedSaplingItemsOperations = saplingItems.map(saplingItem => {
                        let saplingOptionItem = saplingOptionsMap[saplingItem.id]
                        if (saplingOptionItem) {
                            saplingOptionItem.remaining -= saplingItem.count
                            return {
                                updateOne: {
                                    filter: { title: saplingOptionItem.title },
                                    update: { $set: { remaining: saplingOptionItem.remaining } }
                                }
                            }
                        }
                        return null
                    }).filter(item => item)
                    let operationResult
                    if (updatedSaplingItemsOperations.length) {
                        // console.log(JSON.stringify(updatedSaplingItemsOperations),'operation before')
                        operationResult = await SaplingOptions.bulkWrite(updatedSaplingItemsOperations)
                        // console.log(operationResult, updatedSaplingItemsOperations,'operation bulk')
                    }
                    return operationResult;
                }
                let charge, bulkWriteResult
                try {
                    charge = await razorpayInstance.payments.capture(finalToken, finalAmount, 'INR')
                }
                catch (e) {
                    console.log(e,'charges problem')
                    winstonLogger.info('Transaction UNSUCCESSFULL', e)
                    return createError('Problem during transaction.')
                }

                if (saplingItems.length) {
                    bulkWriteResult = await bulkWriteSaplingOptions(saplingItems, saplingOptionsMap)
                }

                let createSaplingDonationResult = await UserSaplingDonation.create({ email, token, amount, items, paymentDetails: charge })

                console.log(createSaplingDonationResult, 'yeyeyey')
                let returnValue = { status: 'success', referenceId: createSaplingDonationResult.id }
                winstonLogger.info(`Transaction SUCCESSFULL => ${prepareObjectForLog({ ...returnValue, ...createSaplingDonationResult})} `)
                return returnValue
            }
        } catch (e) {
            console.log(e, 'wtf')
            winstonLogger.info(`Error in transaction =>  ${prepareObjectForLog(e)} `)
            return createError(e);
        }
    },
    updateSaplings: async (_, args, context) => {
        try {
            let { input, email: emailFromRequest } = args;
            let emailFromToken = await getEmailFromContext(context)
            if (emailFromRequest === emailFromToken) {
                const user = await User.findOne({ email: emailFromRequest})
                if (user.type == 'admin'){
                    for (let i = 0; i < input.length; i++) {
                        let { id, status, type, title, subtitle, cost, content, remaining, createNewRow, removeRow } = input[i]
                        if (createNewRow && id) {
                            let createResponse = await SaplingOptions.create({ status, type, title, subtitle, cost, content, remaining })
                            if (!createResponse) createError('Error occured during creating')
                        }
                        else if (removeRow && id) {
                            let deleteResponse = await SaplingOptions.deleteOne({ _id: new mongoose.Types.ObjectId(id) })
                            if (!deleteResponse) createError('Error occured during remove')
                        }
                        else {
                            const sapling = await SaplingOptions.findOne({ _id: new mongoose.Types.ObjectId(id) });
                            if (!sapling) return createError('Sapling does not exist');
                            let finalInput = { status, type, title, subtitle, cost, content, remaining }
                            console.log(finalInput, 'finalInput')
                            const mergedSapling = mergeJsons(sapling, finalInput)
                            let response = await mergedSapling.save()
                            if (!response) createError('Error occured during update')
                        }
                    }
                    const saplings = await SaplingOptions.find({ })
                    return { response: saplings, status: 'success' }
                }
                return createError('User not admin. Sneaky.')
                
            }
            return createError('Email not valid')
        } catch (e) {
            console.log(e,'e')
            return createError(e);
        }
    },
};