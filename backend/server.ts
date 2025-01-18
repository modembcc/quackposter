import { WebSocketServer } from 'ws';
import { GetRoomsAction, JoinAction, CreateRoomAction, Action, StartRoundAction, getAnswerAction } from './Action';
import { RoomData } from './RoomData';

// Create the WebSocket server
const wss = new WebSocketServer({ port: 8080 });

// Define the state type
interface ServerState {
  [key: string]: RoomData;
}

const state: ServerState = {};  // stores rooms and associated sockets

// Define the message type
interface WebSocketMessage {
  action: 'findall' | 'join' | 'create';
  roomId: string;
}

wss.on('connection', (socket: WebSocket) => {
    wss.on('message', (message:string) => {
    try {
      // Convert Buffer to string if necessary
      const parsedMessage = JSON.parse(message);
      const { action, roomId } = parsedMessage; 
      let actionInstance: Action | null = null;

      switch (action) {
        case 'getRoom':
            actionInstance = new GetRoomsAction();
            break;
        case 'joinRoom':
            actionInstance = new JoinAction();
            break;
        case 'createRoom':
            actionInstance = new CreateRoomAction();
            break;
        case 'getAnswer':
            actionInstance = new getAnswerAction();
            break;
        case 'startRound':
            actionInstance = new StartRoundAction();
            break;

        default:
          console.log('Unknown action');
          socket.send(JSON.stringify({ message: 'Unknown action', action : "invalid" }));
          return;
      }

      if (actionInstance) {
        actionInstance.execute(roomId, socket, state);
      }
    } catch (err) {
      console.error('Error processing message:', err);
      socket.send(JSON.stringify({ message: 'Error processing message' }));
    }
  });
});

// Add error handling for the server
wss.on('error', (error: Error) => {
  console.error('WebSocket server error:', error);
});

// Handle server shutdown
process.on('SIGINT', () => {
  wss.close(() => {
    console.log('Server shut down');
    process.exit(0);
  });
});