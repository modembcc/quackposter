import WebSocket from 'ws';
import { RoomData } from './RoomData';
import { Response } from './RoomData';
// Action Interface
export interface Action {
  execute(id: number | null, socket: WebSocket, state: { [key: number]: RoomData }): void;
}

// FindAllAction Class
export class GetRoomsAction implements Action {
  execute(id: null, socket: WebSocket, state: { [key: number]: RoomData }): void {
    socket.send(JSON.stringify(Object.keys(state).filter(x => !state[x].isFull).map(x => ({id : x, members: state[x].getSize()}))));
  }
}

// JoinAction Class
export class JoinAction implements Action {
  execute(id: number, socket: WebSocket, state: { [key: number]: RoomData }): void {
    const res:Response = state[id].add(socket)
    socket.send(JSON.stringify(res));
  }
}

// CreateAction Class
export class CreateRoomAction implements Action {
  execute(id:null, socket: WebSocket, state: { [key: number]: RoomData }): void {
    console.log("create");
    let randomInRange: number = Math.floor(Math.random() * (1000 - 1 + 1)) + 1;
    while (Object.keys(state).includes(randomInRange.toString())) {
      randomInRange = Math.floor(Math.random() * (1000 - 1 + 1)) + 1;
    }
    state[randomInRange] = new RoomData(socket);
    socket.send(JSON.stringify({ ok: true, msg: `Room ${randomInRange} created successfully` }));
  }
}
