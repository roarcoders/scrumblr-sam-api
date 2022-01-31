const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
const TABLE_WEBSOCKET = process.env.TABLE_WEBSOCKET;
// save a card to the board -> event send message to the aws websocket default route

function getSocketContext(event) {
  const { domainName, stage, connectionId } = event.requestContext;
  const endpoint = `${domainName}/${stage}`;
  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint,
  });

  const send = async (data) => {
    await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: data }).promise();
  };

  return { connectionId, endpoint, send };
}

module.exports.handler = async (event) => {
  console.log(JSON.stringify(event, 2));
  const params = {
    RequestItems: {
      TABLE_WEBSOCKET: {
        Keys: [
          { KEY_NAME: { N: 'KEY_VALUE_1' } },
          { KEY_NAME: { N: 'KEY_VALUE_2' } },
          { KEY_NAME: { N: 'KEY_VALUE_3' } },
        ],
        ProjectionExpression: 'KEY_NAME, ATTRIBUTE',
      },
    },
  };

  // TODO - maybe not batchGetItem but query instead if doesn't work
  const connectionIds = docClient.batchGetItem();

  const { send } = getSocketContext();

  await send(JSON.stringify({ message: 'Message From Default Lambda!' }));

  return { statusCode: 200 };
};
