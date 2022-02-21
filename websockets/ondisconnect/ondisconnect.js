const AWS = require('aws-sdk');

const TABLE_WEBSOCKET = process.env.TABLE_WEBSOCKET;

/** FOR LOCAL TESTING */
if (process.env.NODE_ENV === 'development') {
  console.log('-----> running in developement mode...');

  const YOUR_PROFILE_NAME_AWS_CLI = '' || process.env.AWS_CLI_PROFILE;

  if (!YOUR_PROFILE_NAME_AWS_CLI) {
    console.log('***** DID YOU REMEMBER TO ADD YOUR PROFILE NAME?...****');
    throw Error('no profile name provided');
  }

  const credentials = new AWS.SharedIniFileCredentials({ profile: YOUR_PROFILE_NAME_AWS_CLI });
  AWS.config.credentials = credentials;

  AWS.config.update({ region: 'ap-southeast-2' });
}
/** FOR LOCAL TESTING */

const docClient = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async (event) => {
  const { connectionId = '' } = event.requestContext;

  if (!connectionId) return { statusCode: 400, body: 'No Connection Id' };

  try {
    /** @type {AWS.DynamoDB.DocumentClient.DeleteItemInput} */
    const data = {
      TableName: TABLE_WEBSOCKET,
      Key: {
        ConnectionId: event.requestContext.connectionId,
      },
    };
    await docClient.delete(data).promise();
    return { statusCode: 200, body: 'Disconnected' };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify(error) };
  }
};

if (process.env.NODE_ENV === 'development' && require.main === module) {
  console.log('this is a test');
  // eslint-disable-next-line global-require
  const event = require('../../events/websockets/ondisconnectevent.json');
  exports
    .handler(event)
    .then((res) => console.log(res))
    .catch((err) => console.error(err));
}
