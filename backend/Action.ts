import WebSocket from "ws";
import { RoomData, Response } from "./RoomData.js";
// Action Interface
export interface Action {
  execute(
    id: string | null,
    socket: WebSocket,
    state: { [key: number]: RoomData }
  ): void;
}

// FindAllAction Class
export class GetRoomsAction implements Action {
  execute(
    id: null,
    socket: WebSocket,
    state: { [key: string]: RoomData }
  ): void {
    socket.send(
      JSON.stringify(
        {
          data : Object.keys(state)
            .filter((x) => !state[x].isFull())
            .map((x) => ({ id: x, members: state[x].getSize() })),
          action : "getRooms"
        }
      )
    );
  }
}

// JoinAction Class
export class JoinAction implements Action {
  execute(
    id: string,
    socket: WebSocket,
    state: { [key: string]: RoomData }
  ): void {
    const res: Response = state[id].add(socket);
    socket.send(JSON.stringify(res));
  }
}

// CreateAction Class
export class CreateRoomAction implements Action {
  execute(
    id: null,
    socket: WebSocket,
    state: { [key: string]: RoomData }
  ): void {
    console.log("create");
    let randomInRange: string = (
      Math.floor(Math.random() * (1000 - 1 + 1)) + 1
    ).toString();
    while (Object.keys(state).includes(randomInRange)) {
      randomInRange = (
        Math.floor(Math.random() * (1000 - 1 + 1)) + 1
      ).toString();
    }
    state[randomInRange] = new RoomData(socket);
    console.log("the number of rooms is: " + Object.keys(state).length);

    socket.send(
      JSON.stringify({
        ok: true,
        msg: `Room ${randomInRange} created successfully`,
        action: "createRoom",
      })
    );
  }
}

export class StartRoundAction implements Action {
  execute(
    id: string,
    socket: WebSocket,
    state: { [key: string]: RoomData }
  ): void {
    const room: RoomData = state[id];
    room.sendQuestion()
  }
}

export class getAnswerAction implements Action {
  execute(
    id: string,
    socket: WebSocket,
    state: { [key: string]: RoomData }
  ): void {
    const room: RoomData = state[id];
    socket.send(
      JSON.stringify({
        ok: true,
        answers: room.getAnswer(),
        action: "getAnswer",
      })
    );
  }
}

export class GetVoteAction implements Action {
  execute(
    id: string,
    socket: WebSocket,
    state: { [key: string]: RoomData }
  ): void {
    const room: RoomData = state[id];
    socket.send(
      JSON.stringify({
        ok: true,
        votes: room.getVotes(),
        action: "getAnswer",
      })
    );
    delete state.id
  }
}

export interface MessageAction {
  execute(
    id: string,
    msg: string | null,
    socket: WebSocket,
    state: { [key: number]: RoomData }
  ): void;
}

export class UpdateAnswerAction implements MessageAction {
  execute(
    id: string,
    msg: string,
    socket: WebSocket,
    state: { [key: string]: RoomData }
  ): void {
    const room: RoomData = state[id];
    room.updateAnswer(socket, msg);
  }
}

export interface IndexAction {
  execute(id : number, playerIndex: number, socket: WebSocket, state: { [key: number]: RoomData }): void;
}

export class VoteAction implements IndexAction {
  execute(id: number, playerIndex:number, socket: WebSocket, state: { [key: number]: RoomData }): void {
    const room:RoomData = state[id]
    room.updateVote(playerIndex)
  }
}
