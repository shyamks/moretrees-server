const { registerUser, addUser, updateUser, updateUsers, makePayment, makeDonation, updateSaplings } = require('./user/mutations');

const { loginUser, getUser, getVolunteerOptions, getSaplingOptions, myDonations, getAllUserDonations, getAllUsers} = require('./user/query.js');

module.exports = {
    Query: {
        loginUser,
        getUser,
        getAllUsers,
        getVolunteerOptions,
        getSaplingOptions,
        myDonations,
        getAllUserDonations
    },
    Mutation: {
        registerUser,
        updateUser,
        updateUsers,
        makePayment,
        makeDonation,
        updateSaplings
    }
};