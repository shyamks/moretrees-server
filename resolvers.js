const { registerUser, resetPassword, updateUser, updateUsers, makeDonation, updateSaplings } = require('./user/mutations');

const { loginUser, getUser, forgotPassword, confirmToken, getSaplingOptions, myDonations, getAllUserDonations, getAllUsers} = require('./user/query.js');

module.exports = {
    Query: {
        loginUser,
        getUser,
        forgotPassword,
        confirmToken,
        getAllUsers,
        getSaplingOptions,
        myDonations,
        getAllUserDonations
    },
    Mutation: {
        registerUser,
        resetPassword,
        updateUser,
        updateUsers,
        makeDonation,
        updateSaplings
    }
};