const AmazonCognitoIdentity = require("amazon-cognito-identity-js");
const express = require('express')
var bodyParser = require('body-parser')
const app = express()
const port = 3888
global.fetch = require("node-fetch");
app.use(bodyParser.json())

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

    // cognitoUser.authenticateUser(authenticationDetails, {
    //     onSuccess: async result => {
    //         const token = await result.getAccessToken().getJwtToken()
    //         console.log("\nAccess token [" + title + "] \n" + token);
    //         //console.log("\nid token + " + result.getIdToken().getJwtToken());
    //         //console.log("\nrefresh token + " + result.getRefreshToken().getToken());


    //         // OBTIANING IDENTITY ID
    //         // var idToken = result.idToken.jwtToken;
    //         // AWS.config.region = 'eu-west-1';
    //         // AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    //         //     IdentityPoolId: 'eu-west-1:2bfc304d-6745-42e0-bcb1-31649438afb6',
    //         //     Logins: {
    //         //         'cognito-idp.eu-west-1.amazonaws.com/eu-west-1_4q8N6FQnp': idToken
    //         //     }
    //         // });

    //         // AWS.config.credentials.get(function(err) {
    //         //   if (err) return console.error(err);
    //         //   else console.log(AWS.config.credentials.params.IdentityId);

    //         //   var s3 = new AWS.S3({
    //         //       apiVersion: '2006-03-01',
    //         //       params: {Bucket: 'art-tech-bucket'}
    //         //   });

    //         //   s3.listObjects({Delimiter: '/'}, function(err, data) {
    //         //       //console.log(err, data)
    //         //   });
    //         //});

    //     },
    //     onFailure: function (err) {
    //         console.log(err);
    //     },
    // });
}