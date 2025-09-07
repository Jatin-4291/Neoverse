import express from "express";
import { Server } from "socket.io";
import cors from "cors";
import { createServer } from "http";
import { socket } from "./socket/socket.js";
import router from "./routes/routes.js";
const app = express();
const httpServer = createServer(app);
import dotenv from "dotenv";
dotenv.config();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
app.use(express.json()); // <-- parse JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use("/", router);
socket(io);

const PORT = process.env.PORT || 4500;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
