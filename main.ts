import WebSocket, { WebSocketServer } from "ws";
import crypto from "node:crypto";
import * as Data from "./data";

const wss = new WebSocketServer({ port: 9002 });

type State = {
  chat: Data.Message[];
};

type Room = {
  clients: Set<WebSocket>;
  messageLog: Data.Message[];
  id: string;
};

let rooms = new Set<Room>();

wss.on("connection", function connection(ws) {
  let currentRoom = null;
  // catch client up with current state
  ws.on("error", console.error);

  ws.on("open", function open() {
    console.log("new connection");
  });

  ws.on("message", function message(message, isBinary) {
    const data: Data.Data = JSON.parse(message.toString());
    handleData(data, ws);
  });
});

function handleData(data: Data.Data, ws: WebSocket) {
  switch (data.type) {
    case Data.DataType.MESSAGE: {
      const message = data as Data.Message;
      for (let room of rooms.keys()) {
        if (room.id == message.roomId) {
          // send message to the room with the message id
          room.messageLog.push(message);

          room.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(message), { binary: false });
            }
          });
        }
      }
      break;
    }
    case Data.DataType.CREATE: {
      const create = data as Data.Create;
      let roomId = crypto.randomUUID();
      rooms.add({
        id: roomId,
        clients: new Set<WebSocket>().add(ws),
        messageLog: [],
      });
      ws.send(JSON.stringify({ roomId: roomId }));
      break;
    }
    case Data.DataType.JOIN: {
      const join = data as Data.Join;
      for (let room of rooms.keys()) {
        if ((room.id = join.room)) {
          room.clients.add(ws);

          // playback : configurable?
          room.messageLog.forEach((msg) => {
            ws.send(JSON.stringify(msg));
          });
        }
      }

      break;
    }

    default:
      console.error("Unknown data type: ", data.type, " in ", data);
  }
}
