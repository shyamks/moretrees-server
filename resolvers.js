const { registerUser, addUser, updateUser, makePayment, makeDonation } = require('./user/mutations');

const { getUsers, loginUser, getUser, getVolunteerOptions, getSaplingOptions, myDonations} = require('./user/query.js');

module.exports = {
    Query: {
        getUsers,
        loginUser,
        getUser,
        getVolunteerOptions,
        getSaplingOptions,
        myDonations
    },
    Mutation: {
        registerUser,
        updateUser,
        makePayment,
        makeDonation
    }
};