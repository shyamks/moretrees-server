const { registerUser, resetPassword, updateUser, updateUsers, makeDonation, addPhotoToTimeline, updateSaplings } = require('./user/mutations');

const { loginUser, getUser, forgotPassword, confirmToken, getProjects, myDonations, getAllUserDonations, getAllUsers} = require('./user/query');

export = {
    Query: {
        loginUser,
        getUser,
        forgotPassword,
        confirmToken,
        getAllUsers,
        getProjects,
        myDonations,
        getAllUserDonations
    },
    Mutation: {
        registerUser,
        resetPassword,
        updateUser,
        updateUsers,
        makeDonation,
        addPhotoToTimeline,
        updateSaplings
    }
};