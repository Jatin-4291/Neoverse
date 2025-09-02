import express from "express";
import { Server } from "socket.io";
import cors from "cors";
import { createServer } from "http";
import { socket } from "./socket/socket.js";
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
socket(io);

const PORT = process.env.PORT || 4500;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
