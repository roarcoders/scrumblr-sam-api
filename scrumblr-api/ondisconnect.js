const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async (event) => {
  const data = {
    TableName: process.env.TABLE_WEBSOCKET,
    Key: {
      ConnectionId: event.requestContext.connectionId,
    },
  };

  try {
    await docClient.delete(data).promise();
    return { statusCode: 200, body: 'Disconnected' };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify(error) };
  }
};
