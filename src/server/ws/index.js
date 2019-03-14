const logger = require('../logger');

const charSet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';
const connMap = new Map();

const handleWSConn = (wsConn) => {
  wsConn.on('message', (message) => {
    try {
      message = JSON.parse(message);
      handleMessage(wsConn, message.type, message.data);
    } catch (err) {
      logger.error(err);
    }
  });

  wsConn.on('close', (code, reason) => {
    logger.error(code, reason);

    if (connMap.has(wsConn.clientId)) {
      connMap.delete(wsConn.clientId);
    }
  });

  wsConn.on('error', (err) => {
    logger.error(err);
    wsConn.terminate();

    if (connMap.has(wsConn.clientId)) {
      connMap.delete(wsConn.clientId);
    }
  });
};

const handleMessage = (wsConn, type, data) => {
  switch (type) {
    case 'client-id':
      onMessageClientId(wsConn, data);
      break;
    default:
      break;
  }
};

const onMessageClientId = (wsConn, data) => {
  const clientId = generateClientId();
  connMap.set(clientId, wsConn);

  wsConn.clientId = clientId;
  wsConn.publicKey = data;

  sendWS(wsConn, {
    type: 'client-id',
    data: clientId
  });
};

const sendWS = (wsConn, data, cb) => {
  wsConn.send(JSON.stringify(data), cb);
};

const generateClientId = () => {
  let nextClientId;

  do {
    nextClientId = genNextClientId(4);
  } while (connMap.has(nextClientId));

  return nextClientId;
};

const genNextClientId = (length) => {
  const ln = charSet.length;
  let key = '';

  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * (ln - 1));
    key += charSet.substring(idx, idx + 1);
  }

  return key;
};

module.exports = {
  handleWSConn
};
