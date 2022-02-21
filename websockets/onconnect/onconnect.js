const AWS = require('aws-sdk');

const TABLE_BOARD = process.env.TABLE_BOARD;
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

/** 2 hours is the max a websocket connection can be connected */
const timeToLiveCalc = () => {
  const date = new Date();
  date.setHours(date.getHours() + 2);
  return Math.floor(date.getTime() / 1000);
};

module.exports.handler = async (event) => {
  const { queryStringParameters = {} } = event;

  if (!queryStringParameters?.boardId) {
    return {
      statusCode: 400,
      body: 'No Board Id Present',
    };
  }

  const { boardId } = queryStringParameters;

  try {
    /** @type {AWS.DynamoDB.DocumentClient.GetItemInput} */
    const paramBoard = {
      TableName: TABLE_BOARD,
      Key: { BoardId: boardId },
    };
    const board = await docClient
      .get(paramBoard)
      .promise()
      .catch((error) => console.error(JSON.stringify(error, null, 2), '----> Error'));

    if (!board?.Item) throw Error('That Board Id Was Not Found');

    /** @type {AWS.DynamoDB.DocumentClient.PutItemInput} */
    const data = {
      TableName: TABLE_WEBSOCKET,
      Item: {
        BoardId: boardId,
        ConnectionId: event.requestContext.connectionId,
        TimeToLive: timeToLiveCalc(),
      },
    };

    await docClient.put(data).promise();

    return { statusCode: 200, body: 'Connected' };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify(error) };
  }
};

if (process.env.NODE_ENV === 'development' && require.main === module) {
  console.log('this is a test');
  // eslint-disable-next-line global-require
  const event = require('../../events/websockets/onconnectevent.json');
  exports
    .handler(event)
    .then((res) => console.log(res))
    .catch((err) => console.error(err));
}
