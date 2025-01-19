import WebSocket from "ws";
import dotenv from "dotenv";
dotenv.config();

export type Response = {
  ok: boolean;
  msg: string;
  action: string;
};

type OpenAIResponse = {
  id: string; // Unique identifier for the request
  object: string; // Type of object returned (e.g., "chat.completion")
  created: number; // Timestamp of creation
  model: string; // Model used for the completion
  choices: {
    index: number; // Index of the choice
    message: {
      role: string; // Role of the message (e.g., "assistant")
      content: string; // The actual content of the message
    };
    finish_reason: string; // Reason why the completion stopped
  }[];
  usage?: {
    prompt_tokens: number; // Tokens used for the prompt
    completion_tokens: number; // Tokens used for the completion
    total_tokens: number; // Total tokens used
  };
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
  private players: WebSocket[] = [];
  private round: number = 0;
  private size: number = 0;
  private started: boolean = false;
  private majorityWord: string = generateRandomElem(Object.keys(animals));
  private minorityWord: string = generateRandomElem(Object.keys(animals));
  private minorityIndex: number = Math.floor(Math.random() * 3);
  private answers: string[] = ["", "", "", ""];
  private questions: string[] = []; // same for all answers
  private index: Map<WebSocket, number> = new Map();
  private votes: number[] = [0, 0, 0, 0];

  // add the one calling the data
  constructor(creator: WebSocket) {
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
      } else {
        val.send(this.majorityWord);
      }
    });
  }

  getVotes() {
    return this.votes
  }
  // Add player (WebSocket client) to the room
  add(socket: WebSocket): Response {
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

  updateAnswer(socket: WebSocket, msg: string) {
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
            content:
              "You are a host of a game where there are 2 animal nouns and 4 players, 3 of us get the same noun the other does not. The goal is to identify which person got the different animal from others. Given 2 animals, ask several open ended questions that is not too easy. make the qn more fun and less serious. make it concise",
          },
          {
            role: "user",
            content: `${this.minorityWord} and ${this.majorityWord}`,
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
    const result: OpenAIResponse = (await response.json()) as OpenAIResponse;
    const questions = result.choices[0].message.content;
    this.questions = JSON.parse(questions).questions;
  }

  getQuestion(): string {
    const res: string = this.questions[this.round];
    this.round += 1;
    return res;
  }

  getAnswer(): string[] {
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
  
  getSize(): number {
    return this.size;
  }

  updateVote(index: number): void {
    this.votes[index] += 1;
  }


}
