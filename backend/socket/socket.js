import { Server } from "socket.io";
import { users } from "../users";
import { supabase } from "../supabase";
const protectConnection = (io) => {
  io.use(async (socket, next) => {
    const access_token =
      socket.handshake.headers["authorization"]?.split(" ")[1];
    const uid = socket.handshake.query.uid;
    if (!access_token || !uid) {
      return next(new Error("Unauthorized"));
    } else {
      const { data: user, error: error } = await supabase.auth.getUser(
        access_token
      );
      if (error || !user) {
        return next(new Error("Unauthorized"));
      }
      users.addUser(uid, user);
      next();
    }
  });
};
export const socket = (io) => {
  protectConnection(io);
  io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
};
