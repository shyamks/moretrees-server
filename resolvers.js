const { registerUser, resetPassword, updateUser, updateUsers, makePayment, makeDonation, updateSaplings } = require('./user/mutations');

const { loginUser, getUser, forgotPassword, confirmToken, getVolunteerOptions, getSaplingOptions, myDonations, getAllUserDonations, getAllUsers} = require('./user/query.js');

module.exports = {
    Query: {
        loginUser,
        getUser,
        forgotPassword,
        confirmToken,
        getAllUsers,
        getVolunteerOptions,
        getSaplingOptions,
        myDonations,
        getAllUserDonations
    },
    Mutation: {
        registerUser,
        resetPassword,
        updateUser,
        updateUsers,
        makePayment,
        makeDonation,
        updateSaplings
    }
};