var jwt = require('jsonwebtoken');
var fs = require('fs')

var SECRET = "hello" 

module.exports = {
    getAccessToken: (emailId) => {
        return jwt.sign({email: emailId}, SECRET);
    },
    verifyToken: (token) => {
        return new Promise((resolve, reject)=>{
            jwt.verify(token, SECRET, function(err, decode){
                console.log(`ERROR: ${err}, DECODE: ${JSON.stringify(decode)} VERIFY_TOKEN`)
                if (err){
                    reject(err)
                    return
                }
                resolve(decode)
            })
        })
    },
    mergeJsons: (dbObject, inputObject) =>{
        let dbJSONobject = JSON.parse(JSON.stringify(dbObject));
        let inputJSONobject = JSON.parse(JSON.stringify(inputObject));
        return Object.assign({}, dbJSONobject, inputJSONobject)
    },
    createError: (object) => {
        return { error: object };
    }
}