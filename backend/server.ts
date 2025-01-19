import WebSocket, { WebSocketServer } from "ws";
import {
  GetRoomsAction,
  JoinAction,
  CreateRoomAction,
  Action,
  StartRoundAction,
  getAnswerAction,
  UpdateAnswerAction,
  MessageAction,
  IndexAction,
  VoteAction,
  GetVoteAction
} from "./Action.js";
import { RoomData } from "./RoomData.js";

// Create the WebSocket server
const wss = new WebSocketServer({ port: 8080 });
console.log("Started on port 8080");

// Define the state type
interface ServerState {
  [key: string]: RoomData;
}

const state: ServerState = {}; // stores rooms and associated sockets



wss.on("connection", (socket: WebSocket) => {
  console.log("connection created");

  socket.on("message", (message: string) => {
    console.log("received message");

    try {
      // Parse the incoming message
      const parsedMessage = JSON.parse(message);
      const { action, roomId, msg, playerIndex } = parsedMessage;
      let actionInstance: Action | null = null;
      let messageActionInstance: MessageAction | null = null;
      let indexActionInstance: IndexAction | null = null

      // Handle different actions
      switch (action) {
        case "getRoom":
          actionInstance = new GetRoomsAction();
          break;
        case "joinRoom":
          actionInstance = new JoinAction();
          break;
        case "createRoom":
          actionInstance = new CreateRoomAction();
          break;
        case "getAnswer":
          actionInstance = new getAnswerAction();
          break;
        case "startRound":
          actionInstance = new StartRoundAction();
          break;
        case "updateAnswer":
          messageActionInstance = new UpdateAnswerAction()
          break;
        case "updateVotes":
          indexActionInstance = new VoteAction()
          break;
        case "getVotes":
          actionInstance = new GetVoteAction();
          break;


        default:
          console.log("Unknown action");
          socket.send(
            JSON.stringify({ message: "Unknown action", action: "invalid" })
          );
          return;
      }

      if (actionInstance) {
        actionInstance.execute(roomId, socket, state);
      }
      if (messageActionInstance) {
        messageActionInstance.execute(roomId, msg, socket, state);
      }
      if (indexActionInstance){
        indexActionInstance.execute(roomId,playerIndex,socket,state)
      }
    } catch (err) {
      console.error("Error processing message:", err);
      socket.send(JSON.stringify({ message: "Error processing message" }));
    }
  });
});

// Add error handling for the server
wss.on("error", (error: Error) => {
  console.error("WebSocket server error:", error);
});

// Handle server shutdown
process.on("SIGINT", () => {
  wss.close(() => {
    console.log("Server shut down");
    process.exit(0);
  });
});
