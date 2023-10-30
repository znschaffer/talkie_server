export enum DataType {
  MESSAGE = "message",
  JOIN = "join",
  CREATE = "create",
  DELETE = "delete",
}

export interface Data {
  type: DataType;
}

export interface Message extends Data {
  type: DataType.MESSAGE;
  roomId: string;
  username: string;
  message: string;
  timestamp: string;
}

export interface Join extends Data {
  type: DataType.JOIN;
  roomId: string;
}

export interface Create extends Data {
  type: DataType.CREATE;
}

export interface Delete extends Data {
  type: DataType.DELETE;
  roomId: string;
}