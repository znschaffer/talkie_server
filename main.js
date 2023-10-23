import WebSocket, { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 9002 });

let state = {
  chat: [],
};
wss.on("connection", function connection(ws) {
  ws.on("error", console.error);

  ws.on("message", function message(data, isBinary) {
    console.log(data);
    console.log(JSON.parse(data.toString()));
    state.chat.push(JSON.parse(data.toString()));
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(state), { binary: false });
      }
    });
  });
});
