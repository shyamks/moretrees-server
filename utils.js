var jwt = require('jsonwebtoken');
var fs = require('fs')

var SECRET = "hello"

module.exports = {
    getAccessToken: (emailId) => {
        return jwt.sign({ email: emailId }, SECRET);
    },
    validateRegisterUser: ({ username, password, email }) => {
        var usernameRegex = /^[a-zA-Z0-9]+$/;
        var emailRegex = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
        return (usernameRegex.test(username) && emailRegex.test(email) && password.length >= 6)
    },
    getEmailFromContext: async (context) => {
        const verifyToken = (token) => {
            return new Promise((resolve, reject) => {
                jwt.verify(token, SECRET, function (err, decode) {
                    console.log(`ERROR: ${err}, DECODE: ${JSON.stringify(decode)} VERIFY_TOKEN`)
                    if (err) {
                        reject(err)
                        return
                    }
                    resolve(decode)
                })
            })
        }

        const authorization = context.headers.authorization
        if (authorization) {
            const token = authorization.replace('Bearer ', '')
            const { email } = await verifyToken(token)
            return email
        }

        throw new Error('Not authenticated')
    },
    mergeJsons: (dbObject, inputObject) => {
        // let dbJSONobject = JSON.parse(JSON.stringify(otherKeys));
        // let inputJSONobject = JSON.parse(JSON.stringify(inputObject));
        for (key in inputObject){
            if(inputObject[key] != null)
                dbObject[key] = inputObject[key]
        }
        return dbObject
    },
    createError: (object, status = 'error') => {
        return { error: object, status };
    },
    createSuccess: (status = 'success') => {
        return { status };
    }
}