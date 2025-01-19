import { WebSocketServer } from "ws";
import { GetRoomsAction, JoinAction, CreateRoomAction, StartRoundAction, getAnswerAction, } from "./Action.js";
// Create the WebSocket server
const wss = new WebSocketServer({ port: 8080 });
console.log("Started on port 8080");
const state = {}; // stores rooms and associated sockets
wss.on("connection", (socket) => {
    console.log("connection created");
    socket.on("message", (message) => {
        console.log("received message");
        try {
            // Parse the incoming message
            const parsedMessage = JSON.parse(message);
            const { action, roomId } = parsedMessage;
            let actionInstance = null;
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
                default:
                    console.log("Unknown action");
                    socket.send(JSON.stringify({ message: "Unknown action", action: "invalid" }));
                    return;
            }
            if (actionInstance) {
                actionInstance.execute(roomId, socket, state);
            }
        }
        catch (err) {
            console.error("Error processing message:", err);
            socket.send(JSON.stringify({ message: "Error processing message" }));
        }
    });
});
// Add error handling for the server
wss.on("error", (error) => {
    console.error("WebSocket server error:", error);
});
// Handle server shutdown
process.on("SIGINT", () => {
    wss.close(() => {
        console.log("Server shut down");
        process.exit(0);
    });
});
