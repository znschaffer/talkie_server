import WebSocket, { WebSocketServer } from "ws";
import crypto from "node:crypto";

const wss = new WebSocketServer({ port: 9002 });
import { Create, Data, DataType, Delete, Join, Message } from "./data";
import pino from "pino";

// setup logger

const fileTransport = pino.transport({
  target: "pino/file",
  options: { destination: `${__dirname}/talkie.log` },
});

const log = pino({}, fileTransport);

/**
 * A talkie room
 *
 *
 */
class Room {
  clients: Set<WebSocket>;
  messageLog: Message[];
  /**
   * Create a room.
   * @param {WebSocket} initialConnection The first connection to a room
   */
  constructor(initialConnection: WebSocket | null) {
    this.clients = new Set<WebSocket>();
    if (initialConnection) {
      this.clients.add(initialConnection);
    }
    this.messageLog = [];
  }
  /**
   * Replays all logged messages to websocket
   *  @method
   *  @param {WebSocket} ws WebSocket to send messages to
   */
  replay(ws: WebSocket) {
    this.messageLog.forEach((msg) => {
      ws.send(JSON.stringify(msg));
    });
  }

  /**
   *  Adds a message to the room log,
   *  then sends it out to all connected clients
   *  @method
   *  @param {Message} message Message to send
   */
  sendMessage(message: Message) {
    this.messageLog.push(message);

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message), { binary: false });
      }
    });
  }
}

let rooms = new Map<string, Room>();

wss.on("connection", function connection(ws) {
  ws.on("error", (err) => log.error(err));
  ws.on("open", function open() {
    log.info("new connection");
  });
  ws.on("message", function message(message, isBinary) {
    // log incoming messages
    log.info(message.toString());
    try {
      const data: Data = JSON.parse(message.toString());
      handleData(data, ws);
    } catch {
      console.error("Bad JSON: ", message.toString());
      const resp = { error: "Bad JSON" };
      log.error(resp);
      ws.send(JSON.stringify(resp));
    }
  });
});

function handleData(data: Data, ws: WebSocket) {
  switch (data.type) {
    case DataType.MESSAGE: {
      const message = data as Message;
      const room = rooms.get(message.roomId);
      if (room) {
        room.sendMessage(message);
      }
      break;
    }
    case DataType.CREATE: {
      let roomId = crypto.randomUUID();
      rooms.set(roomId, new Room(ws));
      ws.send(JSON.stringify({ roomId }));
      break;
    }
    case DataType.JOIN: {
      const join = data as Join;
      const room = rooms.get(join.roomId);
      if (room) {
        room.clients.add(ws);
        room.replay(ws);
      }

      break;
    }
    case DataType.DELETE: {
      const del = data as Delete;
      rooms.delete(del.roomId);
    }
    default:
      console.error("Unknown data type: ", data.type, " in ", data);
  }
}
