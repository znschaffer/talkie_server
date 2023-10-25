import WebSocket, { WebSocketServer } from "ws";
import * as Data from "./data";

const wss = new WebSocketServer({ port: 9002 });

type State = {
  chat: Data.Message[];
};

let state: State;
wss.on("connection", function connection(ws) {
  // catch client up with current state
  ws.send(JSON.stringify(state), { binary: false });

  ws.on("error", console.error);

  ws.on("open", function open() {
    console.log("new connection");
  });

  ws.on("message", function message(message, isBinary) {
    const data: Data.Data = JSON.parse(message.toString());
    handleData(data, ws);
    state.chat.push(JSON.parse(data.toString()));
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(state), { binary: false });
      }
    });
  });
});

function handleData(data: Data.Data, ws: WebSocket) {
  switch (data.type) {
    case Data.DataType.MESSAGE: {
      const message = data as Data.Message;
      state.chat.push(message);
    }
  }
}
