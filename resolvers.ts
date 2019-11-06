const { registerUser, resetPassword, updateUser, updateUsers, makeDonation, updateUserDonations, addPhotoToTimeline, updateProjects } = require('./user/mutations');

const { isEmailAvailable, loginUser, getUser, forgotPassword, confirmToken, getProjects, myDonations, getAllUserDonations, getAllUsers} = require('./user/query');

export = {
    Query: {
        isEmailAvailable,
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
        updateUserDonations,
        addPhotoToTimeline,
        updateProjects
    }
};