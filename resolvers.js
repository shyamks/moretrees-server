const { registerUser, addUser, updateUser } = require('./user/mutations');

const { getUsers, loginUser, getVolunteerOptions} = require('./user/query.js');

module.exports = {
    Query: {
        getUsers,
        loginUser,
        getVolunteerOptions
    },
    Mutation: {
        registerUser,
        updateUser
    }
};