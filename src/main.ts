import WebSocket, { WebSocketServer } from "ws";
import crypto from "node:crypto";

const wss = new WebSocketServer({ port: 9002 });
import { Data, DataType, Delete, Join, Message } from "./types/data";
import pino from "pino";
import { Room } from "./lib/Room";

// setup logger

const fileTransport = pino.transport({
  target: "pino/file",
  options: { destination: `${__dirname}/talkie.log` },
});

const log = pino({}, fileTransport);

let rooms = new Map<string, Room>();

wss.on("connection", function connection(ws) {
  ws.on("error", log.error);
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
      let roomId = crypto.randomUUID()
      rooms.set(roomId, new Room(ws, roomId));
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
