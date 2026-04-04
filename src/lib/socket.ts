import { io } from "socket.io-client";
import { getSocketOrigin } from "./publicApi";

const socketUrl = getSocketOrigin();

export const socket = io(socketUrl, {
  autoConnect: true,
  reconnectionAttempts: 8,
  reconnectionDelay: 1500,
  transports: ["websocket", "polling"],
});
