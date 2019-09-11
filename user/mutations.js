const lodash = require('lodash')

let { getAccessToken, createError, mergeJsons, getEmailFromContext, validateRegisterUser } = require('../utils');
const { User, VolunteerOptions, UserSaplingDonation, SaplingOptions } = require('./models');
const stripe = require('stripe')('sk_test_uFiRW5IFP6XK1mUm1f969jU0')

module.exports = {
    registerUser: async (_, args) => {
        try {
            const { username, password, email } = args;
            const user = await User.find({ email: args.email });
            console.log(user, 'wlwllw')
            if (!user.length) {
                if (validateRegisterUser({ username, password, email })) {
                    let response = await User.create({ username, password, email });
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

            let { username, password, email, phone, bio, industry, role, volunteerOptions } = input
            let emailFromToken = await getEmailFromContext(context)
            if (email === emailFromToken) {
                const user = await User.findOne({ email });
                if (!user) return createError('Email already exists. Please try another email');
                let finalInput = { bio, industry, phone, role, volunteerOptions }
                const mergedUserForResponse = mergeJsons(user, finalInput)
                let response = await mergedUserForResponse.save()
                return response ? response : createError('Error occured during update')
            }
        } catch (e) {
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
            let { email, token, amount, items, donationAmount } = input
            let emailFromToken = await getEmailFromContext(context)
            if (email === emailFromToken) {

                let finalToken = token
                let finalAmount = (amount + donationAmount) * 100;

                let saplingOptions = await SaplingOptions.find({ status: 'ACTIVE' })
                let saplingItems = items;
                
                // console.log(saplingItems,saplingOptions,'saaaaaa')
                let saplingOptionsMap = saplingOptions.reduce((map, object)=> {
                    map[object.id] = object
                    return map
                }, {})
                
                let canTransactionHappen = saplingItems.map(saplingItem => {
                    let saplingOptionItem = saplingOptionsMap[saplingItem.id]
                    if (saplingOptionItem.remainingSaplings >= saplingItem.count){
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
                                saplingOptionItem.remainingSaplings -= saplingItem.count
                                return {
                                    updateOne: {
                                        filter: { saplingName: saplingOptionItem.saplingName },
                                        update: { $set: { remainingSaplings: saplingOptionItem.remainingSaplings } }
                                    }
                                }
                            }
                            return null
                        }).filter(item => item)
                        let operationResult
                        if (updatedSaplingItemsOperations.length){
                            // console.log(JSON.stringify(updatedSaplingItemsOperations),'operation before')
                            operationResult = await SaplingOptions.bulkWrite(updatedSaplingItemsOperations)
                            // console.log(operationResult, updatedSaplingItemsOperations,'operation bulk')
                        }
                        return operationResult;
                    }
                    let charge
                    try {
                         charge = await stripe.charges.create({
                            amount: finalAmount,
                            currency: 'inr',
                            description: 'Donation',
                            source: finalToken,
                        });
                    }
                    catch (e) {
                        return createError('Problem while making a transaction.')
                    }
                    

                    let bulkWriteResult = await bulkWriteSaplingOptions(saplingItems,saplingOptionsMap)
                    let createSaplingDonationResult = await UserSaplingDonation.create({ email, token, amount, items, donationAmount, paymentDetails: charge })

                    // console.log(bulkWriteResult, createSaplingDonationResult, 'yeyeyey')
                    return { status: 'success' }
                }
            }
        } catch (e) {
            console.log(e, 'wtf')
            return createError(e);
        }
    },
};