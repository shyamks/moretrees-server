var jwt = require('jsonwebtoken');
var fs = require('fs')

var SECRET = "hello"

module.exports = {
    getAccessToken: (emailId) => {
        return jwt.sign({ email: emailId }, SECRET);
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
        for (key in inputObject)
            dbObject[key] = inputObject[key]
        return dbObject
    },
    createError: (object) => {
        return { error: object };
    }
}