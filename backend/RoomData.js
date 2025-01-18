import dotenv from "dotenv";
dotenv.config();
const animals = [
    "Lion",
    "Elephant",
    "Tiger",
    "Giraffe",
    "Zebra",
    "Kangaroo",
    "Panda",
    "Koala",
    "Bear",
    "Monkey",
    "Penguin",
    "Cheetah",
    "Dolphin",
    "Whale",
    "Gorilla",
    "Sloth",
    "Hippo",
    "Rhinoceros",
    "Leopard",
    "Flamingo",
    "Wolf",
];
function generateRandomElem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
export class RoomData {
    // add the one calling the data
    constructor(creator) {
        this.players = [];
        this.round = 0;
        this.size = 0;
        this.started = false;
        this.majorityWord = generateRandomElem(Object.keys(animals));
        this.minorityWord = generateRandomElem(Object.keys(animals));
        this.minorityIndex = Math.floor(Math.random() * 3);
        this.answers = ["", "", "", ""];
        this.questions = []; // same for all answers
        this.index = new Map();
        this.votes = [0, 0, 0, 0];
        this.players.push(creator);
        this.index.set(creator, 0);
        this.size += 1;
        while (this.majorityWord === this.minorityWord) {
            this.minorityWord = generateRandomElem(animals);
        }
    }
    setUpRoom() {
        this.players.forEach((val, index) => {
            if (index === this.minorityIndex) {
                val.send(this.minorityWord);
            }
            else {
                val.send(this.majorityWord);
            }
        });
    }
    // Add player (WebSocket client) to the room
    add(socket) {
        if (this.isFull()) {
            return { ok: false, msg: "Room is Full", action: "joinRoom" };
        }
        this.players.push(socket);
        this.index.set(socket, this.size);
        this.size += 1;
        if (this.size === 4) {
            this.started = true;
            this.setUpRoom();
        }
        return { ok: true, msg: "Joined Successfully", action: "joinRoom" };
    }
    updateAnswer(socket, msg) {
        const socketIndex = this.index.get(socket);
        if (socketIndex !== undefined && socketIndex !== null) {
            this.answers[socketIndex] = msg;
        }
    }
    async generateQuestions() {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-2024-08-06",
                messages: [
                    {
                        role: "system",
                        content: "You are a host of a game where there are 2 animal nouns and 4 players, 3 of us get the same noun the other does not. The goal is to identify which person got the different animal from others. Given 2 animals, ask several open ended questions that is not too easy. make the qn more fun and less serious. make it concise",
                    },
                    {
                        role: "user",
                        content: "cats and dogs",
                    },
                ],
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "game_questions",
                        schema: {
                            type: "object",
                            properties: {
                                questions: {
                                    type: "array",
                                    items: {
                                        type: "string",
                                    },
                                },
                            },
                            required: ["questions"],
                            additionalProperties: false,
                        },
                    },
                },
            }),
        });
        const result = (await response.json());
        const questions = result.choices[0].message.content;
        this.questions = JSON.parse(questions).questions;
    }
    getQuestion() {
        const res = this.questions[this.round];
        this.round += 1;
        return res;
    }
    getAnswer() {
        return this.answers;
    }
    isFull() {
        return this.started;
    }
    isFirstRound() {
        return this.round === 0;
    }
    isLastRound() {
        return this.round === 2;
    }
    // Broadcast message to all players in the room
    // private static broadcastMsg(msg: Record<string,boolean>): void {
    //   this.players.forEach((client) => {
    //     if (client.readyState === WebSocket.OPEN) {
    //       client.send(msg);
    //     }
    //   });
    // }
    getSize() {
        return this.size;
    }
    updateVote(index) {
        this.votes[index] += 1;
    }
}
