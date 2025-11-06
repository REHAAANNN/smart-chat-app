import { Server } from "socket.io";
import { initSocket } from "./initSocket";

let io: Server;
export const setupSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:5174"], // allow both ports
      methods: ["GET", "POST"],
      credentials: true, // <-- ensure this is enabled!
    },
  });

  initSocket(io);
  console.log("✅ Socket.io initialized");
};
