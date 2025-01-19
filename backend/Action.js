import { RoomData } from "./RoomData.js";
// FindAllAction Class
export class GetRoomsAction {
    execute(id, socket, state) {
        socket.send(JSON.stringify(Object.keys(state)
            .filter((x) => !state[x].isFull())
            .map((x) => ({ id: x, members: state[x].getSize() }))));
    }
}
// JoinAction Class
export class JoinAction {
    execute(id, socket, state) {
        const res = state[id].add(socket);
        socket.send(JSON.stringify(res));
    }
}
// CreateAction Class
export class CreateRoomAction {
    execute(id, socket, state) {
        console.log("create");
        let randomInRange = (Math.floor(Math.random() * (1000 - 1 + 1)) + 1).toString();
        while (Object.keys(state).includes(randomInRange)) {
            randomInRange = (Math.floor(Math.random() * (1000 - 1 + 1)) + 1).toString();
        }
        state[randomInRange] = new RoomData(socket);
        console.log("the number of rooms is: " + Object.keys(state).length);
        socket.send(JSON.stringify({
            ok: true,
            msg: `Room ${randomInRange} created successfully`,
            action: "createRoom",
        }));
    }
}
export class StartRoundAction {
    execute(id, socket, state) {
        const room = state[id];
        socket.send(JSON.stringify({
            ok: true,
            isLastRound: room.isLastRound(),
            question: room.getQuestion(),
            action: "startRound",
        }));
    }
}
export class getAnswerAction {
    execute(id, socket, state) {
        const room = state[id];
        socket.send(JSON.stringify({
            ok: true,
            answers: room.getAnswer(),
            action: "getAnswer",
        }));
    }
}
export class updateAnswerAction {
    execute(id, msg, socket, state) {
        const room = state[id];
        room.updateAnswer(socket, msg);
    }
}
// export interface IndexAction {
//   execute(id : number, playerIndex: number, socket: WebSocket, state: { [key: number]: RoomData }): void;
// }
// export class voteAction implements IndexAction {
//   execute(id: number, playerIndex:number, socket: WebSocket, state: { [key: number]: RoomData }): void {
//     const room:RoomData = state[id]
//     room.updateVote(playerIndex)
//   }
// }
