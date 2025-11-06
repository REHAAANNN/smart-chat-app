import express from "express";
import cors from "cors";
import { createServer } from "http";
import dotenv from "dotenv";
import { setupSocket } from "./utils/socket";

dotenv.config();

const app = express();
const server = createServer(app);

const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:5173";
const PORT = Number(process.env.PORT ?? 5000);

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

// All communication handled via Socket.io (see utils/socket.ts)

setupSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
