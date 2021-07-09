// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';
//let response;
const awsServerlessExpress = require('@vendia/serverless-express');
const app = require('./app');


exports.lambdaHandler = awsServerlessExpress({app});


// async (event, context) => {
//     try {
//         // const ret = await axios(url);
//             response = awsServerlessExpress.proxy(server, event, context)
//         }
//         catch (err) {
//         console.log(err);
//         return err;
//     }

//     return response
// };
