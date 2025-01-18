const WebSocket = require("ws");
const url = require("url");

// Create a WebSocket server
const server = new WebSocket.Server({ port: 8080 });

const rooms = new Map();

class RoomData {
  constructor() {
    this.players = [];
    this.started = false;
    this.majorityWord = "";
    this.minorityWord = "";
    this.minorityPLayer = Math.floor(Math.random() * 4);
    this.answers = [];
    this.votes = [];
  }

  add(socket) {
    this.players.push(socket);
  }
}

server.on("connection", (socket, request) => {
  const room = url.parse(request.url, true).query.room || "default";
  console.log("Client connected");

  if (!rooms.has(room)) {
    rooms.set(room, new RoomData());
  }
  rooms.get(room).add(socket);

  // Send a message to the client
  socket.send(JSON.stringify({ message: "Welcome to the WebSocket server!" }));

  // Handle incoming messages
  socket.on("message", (obj) => {
    try {
      const parseddata = JSON.parse(obj);
      console.log("Received from client:", parseddata.msg);
      BroadcastMsgToRoom(room, parseddata.msg);
    } catch (e) {
      socket.send(JSON.stringify(e));
    }
  });

  // Handle client disconnection
  socket.on("close", () => {
    console.log("Client disconnected");
  });
});

const BroadcastMsgToRoom = (room, msg) => {
  if (rooms.has(room)) {
    rooms.get(room).players.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  }
};
