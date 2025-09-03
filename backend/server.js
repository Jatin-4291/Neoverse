import express from "express";
import { Server } from "socket.io";
import cors from "cors";
import { createServer } from "http";
import { socket } from "./socket/socket.js";
import router from "./routes/routes.js";
const app = express();
const httpServer = createServer(app);
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
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
