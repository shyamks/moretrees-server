const lodash = require('lodash')
const mongoose = require('mongoose');

let { getAccessToken, createError, createSuccess, mergeJsons, getEmailFromContext, validateRegisterUser } = require('../utils');
const { User, VolunteerOptions, UserSaplingDonation, SaplingOptions } = require('./models');
const Razorpay = require('razorpay')

const razorpayInstance = new Razorpay({
    key_id: 'rzp_test_cxpMW5qj3FfIZD',
    key_secret: 'B3AunkV7bOzjYdzIUHPFGtVc'
})
module.exports = {
    registerUser: async (_, args) => {
        try {
            const { username, password, email, phone: mobile } = args;
            const user = await User.find({ email: args.email });
            console.log(user, 'wlwllw')
            if (!user.length) {
                if (validateRegisterUser({ username, password, email })) {
                    let response = await User.create({ username, password, email, mobile });
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
            // console.log(input, email, 'really')
            let emailFromToken = await getEmailFromContext(context)
            // console.log(args, 'args')
            if (emailFromRequest === emailFromToken) {
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
                return createSuccess()
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
            console.log(canTransactionHappen, 'tokeeeee')
            if (!canTransactionHappen)
                return createError('Not enough saplings left to make a donation')
            if (!token)
                return createError('Token not present in the input');
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
                    return createError('Problem while making a transaction.')
                }

                if (saplingItems.length) {
                    bulkWriteResult = await bulkWriteSaplingOptions(saplingItems, saplingOptionsMap)
                }

                let createSaplingDonationResult = await UserSaplingDonation.create({ email, token, amount, items, paymentDetails: charge })

                console.log(createSaplingDonationResult, 'yeyeyey')
                return { status: 'success', referenceId: createSaplingDonationResult.id }
                // }
            }
        } catch (e) {
            console.log(e, 'wtf')
            return createError(e);
        }
    },
    updateSaplings: async (_, args, context) => {
        try {
            let { input, email: emailFromRequest } = args;
            // console.log(input, email, 'really')
            let emailFromToken = await getEmailFromContext(context)
            // console.log(args, 'args')
            if (emailFromRequest === emailFromToken) {
                for (let i = 0; i < input.length; i++) {
                    let { id, status, type, title, subtitle, cost, content, remaining } = input[i]
                    const sapling = await SaplingOptions.findOne({ _id: new mongoose.Types.ObjectId(id) });
                    if (!sapling) return createError('Sapling does not exist');
                    let finalInput = { status, type, title, subtitle, cost, content, remaining }
                    console.log(finalInput, 'finalInput')
                    const mergedSapling = mergeJsons(sapling, finalInput)
                    let response = await mergedSapling.save()
                    if (!response) createError('Error occured during update')
                }
                return createSuccess()
            }
            return createError('Email not valid')
        } catch (e) {
            console.log(e,'e')
            return createError(e);
        }
    },
};