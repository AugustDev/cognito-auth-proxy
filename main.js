const AmazonCognitoIdentity = require("amazon-cognito-identity-js");
const express = require('express')
var bodyParser = require('body-parser')
const app = express()
const port = 3888
global.fetch = require("node-fetch");
app.use(bodyParser.json())

// check health, useful in CI
app.get("/health", (req, res) => {
    res.json({
        status: "Alive"
    })
})

// Accepts authentication data 
app.post('/', async (req, res) => {
    const poolId = req.body.pool_id
    const clientId = req.body.client_id
    const username = req.body.username
    const password = req.body.password

    try {
        creds = await Login(username, password, poolId, clientId)
        res.json(creds)

    } catch (error) {
        console.log(error)
        res.status(500)
        res.send()
    }

})

app.listen(port, () => {
    console.log(`Cognito auth proxy is listening on port ${port}`)
})


// turning into promise, looks cleaner
const loginPromise = (cognitoUser, authDetails) => {
    return new Promise((resolve, reject) => {
        cognitoUser.authenticateUser(authDetails, {
            onSuccess: result => resolve(result),
            onFailure: err => reject(err),
        });
    })
}

// login promise
var Login = async (username, password, poolId, clientId) => {

    const poolData = {
        UserPoolId: poolId,
        ClientId: clientId,
    };
    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
        Username: username,
        Password: password,
    });

    var userData = {
        Username: username,
        Pool: userPool,
    };
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    return new Promise(async (resolve, reject) => {
        try {
            const res = await loginPromise(cognitoUser, authenticationDetails)
            const accessToken = res.accessToken.jwtToken
            const sub = res.accessToken.payload.sub
            resolve({
                accessToken,
                sub
            })
        } catch (error) {
            reject(error)
        }
    })
}