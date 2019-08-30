const { registerUser, addUser, updateUser } = require('./user/mutations');

const { getUsers, loginUser, getUser, getVolunteerOptions} = require('./user/query.js');

module.exports = {
    Query: {
        getUsers,
        loginUser,
        getUser,
        getVolunteerOptions
    },
    Mutation: {
        registerUser,
        updateUser
    }
};