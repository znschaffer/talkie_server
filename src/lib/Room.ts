import { Message } from "../types/data";
import WebSocket from "ws";

/** A talkie room */
export class Room {
  id: string;
  clients: Set<WebSocket>;
  messageLog: Message[];

  /**
   * Create a room.
   * @param {WebSocket} initialConnection The first connection to a room
   */
  public constructor(id: string) {
    this.clients = new Set<WebSocket>();
    this.id = id;
    this.messageLog = [];
  }

  /**
   * Replays all logged messages to websocket
   *  @param {WebSocket} ws WebSocket to send messages to
   */
  public replay(ws: WebSocket) {
    this.messageLog.forEach((msg) => {
      ws.send(JSON.stringify(msg));
    });
  }

  /**
   *  Adds a message to the room log,
   *  then sends it out to all connected clients
   *  @param {Message} message Message to send
   */
  public sendMessage(message: Message) {
    this.messageLog.push(message);
    this.clients.forEach((client) => {
      if (client.readyState === 1)
        client.send(JSON.stringify(message), { binary: false });
    });
  }
}
