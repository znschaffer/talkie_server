"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importStar(require("ws"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const Data = __importStar(require("./data"));
const wss = new ws_1.WebSocketServer({ port: 9002 });
let rooms = new Set();
wss.on("connection", function connection(ws) {
    let currentRoom = null;
    // catch client up with current state
    ws.on("error", console.error);
    ws.on("open", function open() {
        console.log("new connection");
    });
    ws.on("message", function message(message, isBinary) {
        const data = JSON.parse(message.toString());
        handleData(data, ws);
    });
});
function handleData(data, ws) {
    switch (data.type) {
        case Data.DataType.MESSAGE: {
            const message = data;
            for (let room of rooms.keys()) {
                if (room.id == message.roomId) {
                    // send message to the room with the message id
                    room.messageLog.push(message);
                    room.clients.forEach((client) => {
                        if (client.readyState === ws_1.default.OPEN) {
                            client.send(JSON.stringify(message), { binary: false });
                        }
                    });
                }
            }
            break;
        }
        case Data.DataType.CREATE: {
            const create = data;
            let roomId = node_crypto_1.default.randomUUID();
            rooms.add({
                id: roomId,
                clients: new Set().add(ws),
                messageLog: [],
            });
            ws.send(JSON.stringify({ roomId: roomId }));
            break;
        }
        case Data.DataType.JOIN: {
            const join = data;
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
