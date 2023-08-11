const http = require('http');
const WebSocket = require('ws');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server is running.');
});

const wss = new WebSocket.Server({ server });

const clients = {}; // Store client connections with assigned IDs
const userInfo = {}

wss.on('connection', (ws) => {
  const clientId = generateClientId();
  const color = Math.random() * 0xffffff
  console.log("clientId 생성", clientId)
  userInfo.clientId = {clientId, color, x: 0, y: 0, z: 0}
  ws.send(JSON.stringify({ userInfo: userInfo.clientId }));  
  clients[clientId] = ws;
  console.log("현재 접속 유저: ", Object.keys(clients))
  ws.on('open', () => {
    wss.clients.forEach((client) => {
      client.send("New User Join!")
    })
  })
  ws.on('message', (message) => {
    const receivedMessage = message.toString('utf-8');
    // console.log('Received:', receivedMessage);
    // console.log("Server: ", message, "wss.clients: ", wss.clients)
    // Broadcast received message to all clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        // console.log("전송", receivedMessage)
        client.send(JSON.stringify({userInfo: receivedMessage}));
      }
    });
  });

  ws.on('close', () => {
    // Remove the client from the clients object when they disconnect
    delete clients[clientId];
  });
});

server.listen(8080, () => {
  console.log('WebSocket server is listening on port 8080.');
});



function generateClientId() {
  // Generate a random ID or use a more complex method to generate IDs
  return Math.random().toString(36).substr(2, 9);
}