const WebSocket = require('ws');

// Create a WebSocket server
const server = new WebSocket.Server({ port: 8080 });

server.on('connection', (socket) => {
  console.log('Client connected');

  // Send a message to the client
  socket.send(JSON.stringify({ message: 'Welcome to the WebSocket server!' }));

  // Handle incoming messages
  socket.on('message', (obj) => {
    const parseddata = JSON.parse(obj)
    console.log('Received from client:', parseddata.msg);
    socket.send(JSON.stringify({ message: `You said: ${parseddata.msg}` }));
  });

  // Handle client disconnection
  socket.on('close', () => {
    console.log('Client disconnected');
  });
});
