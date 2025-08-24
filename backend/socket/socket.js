import { Server } from "socket.io";
import { users } from "../users";
import { supabase } from "../supabase";
import { sessionManager } from "../session";
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
    const on = (eventName, callback) => {
      socket.on(eventName, (data) => {
        const session = sessionManager.getPlayerSession(
          socket.handshake.query.uid
        );
        if (!session) {
          return;
        }
        callback({ session, data });
      });
    };
    socket.on("joinRealm", async (realmData) => {
      const uid = socket.handshake.query.uid;
      const rejectJoin = (reason) => {
        socket.emit("failedToJoinRoom", reason);
        joiningInProgress.delete(uid);
      };
      const session = sessionManager.getSession(realmData.realmId);
      if (session) {
        const playerCount = session.getPlayerCount();
        if (playerCount >= 30) {
          return rejectJoin("Space is full. It's 30 players max.");
        }
      }
      const { data: realm, error } = await supabase
        .from("realms")
        .select("owner_id", "share_id", "map_data", "only_owner")
        .eq("id", realmData.realmId)
        .single();

      if (error || !data) {
        return rejectJoin("Space not found.");
      }
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("skin")
        .eq("id", uid)
        .single();
      if (profileError) {
        return rejectJoin("Failed to get profile.");
      }
      const join = async () => {
        if (!sessionManager.getSession(realmData.realmId)) {
          sessionManager.createSession(realmData.realmId, data.map_data);
        }

        const currentSession = sessionManager.getPlayerSession(uid);
        if (currentSession) {
          kickPlayer(uid, "You have logged in from another location.");
        }

        const user = users.getUsers(uid);
        const username = formatEmailToName(user.user_metadata.email);
        sessionManager.addPlayerToSession(
          socket.id,
          realmData.realmId,
          uid,
          username,
          profile.skin
        );
        const newSession = sessionManager.getPlayerSession(uid);
        const player = newSession.getPlayer(uid);

        socket.join(realmData.realmId);
        socket.emit("joinedRealm");
        emit("playerJoinedRoom", player);
        joiningInProgress.delete(uid);
      };
      if (realm.owner_id === socket.handshake.query.uid) {
        return join();
      }
      if (realm.only_owner) {
        return rejectJoin("This realm is private right now. Come back later!");
      }

      if (realm.share_id === realmData.shareId) {
        return join();
      } else {
        return rejectJoin("The share link has been changed.");
      }
    });
    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
};
