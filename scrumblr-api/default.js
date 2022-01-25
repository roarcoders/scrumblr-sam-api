const AWS = require('aws-sdk');

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

  const { send } = getSocketContext(event);

  await send(JSON.stringify({ message:  }));

  return { statusCode:200 };
};
