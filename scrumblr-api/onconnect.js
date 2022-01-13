const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async (event) => {
  const putParams = {
    TableName: process.env.TABLE_WEBSOCKET,
    Item: {
      ConnectionId: { S: event.requestContext.connectionId },
    },
  };

  try {
    await docClient.put(putParams).promise();
    return { statusCode: 200, body: 'Connected' };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify(error) };
  }
};
