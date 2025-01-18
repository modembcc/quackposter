import WebSocket from "ws";
import dotenv from "dotenv";

dotenv.config();

export type Response = {
  ok: boolean;
  msg: string;
};

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

function generateRandomElem(arr: Object[]): any {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class RoomData {
  private players: Map<WebSocket, string> = new Map();
  private round: number = 0;
  private size: number = 0;
  private started: boolean = false;
  private majorityWord: string = generateRandomElem(Object.keys(animals));
  private minorityWord: string = generateRandomElem(Object.keys(animals));
  private minorityPlayer: WebSocket | null = null;
  private answers: string[] = []; // same for all users
  private questions: string[] = []; // same for all answers

  // add the one calling the data
  constructor(creator: WebSocket) {
    this.players.set(creator, "");
    while (this.majorityWord === this.minorityWord) {
      this.minorityWord = generateRandomElem(animals);
    }
  }

  setUpRoom() {
    this.minorityPlayer = generateRandomElem(Object.keys(this.players));
    for (let key of this.players.keys()) {
      if (key === this.minorityPlayer) {
        this.players.set(key, this.minorityWord);
      } else {
        this.players.set(key, this.majorityWord);
      }
    }
  }
  // Add player (WebSocket client) to the room
  add(socket: WebSocket): Response {
    if (this.isFull()) {
      return { ok: false, msg: "Room is Full" };
    }
    this.size += 1;
    this.players.set(socket, "");
    if (this.size === 4) {
      this.started = true;
      this.setUpRoom;
    }
    return { ok: true, msg: "Joined Successfully" };
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
            content: `You are hosting a game with 2 animal nouns and 4 players. 
              Three players share the same noun, while one gets a different one. 
              The goal is to figure out who has the odd animal. 
              Using the given animals, come up with fun, open-ended questions 
              that are engaging but not too obvious. Keep the tone light and playful, 
              and make the questions concise.`,
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
    const result = await response.json();
    const questions = result.choices[0].message.content;
    this.questions = JSON.parse(questions).questions;
  }

  isFull() {
    return this.started;
  }

  // Broadcast message to all players in the room
  // private static broadcastMsg(msg: Record<string,boolean>): void {
  //   this.players.forEach((client) => {
  //     if (client.readyState === WebSocket.OPEN) {
  //       client.send(msg);
  //     }
  //   });
  // }
  getSize(): number {
    return this.size;
  }
}
