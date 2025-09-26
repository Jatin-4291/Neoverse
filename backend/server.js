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

const allowedOrigins = [
  "http://localhost:3000", // for local dev
  "https://neoverse-topaz.vercel.app", // production
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
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
