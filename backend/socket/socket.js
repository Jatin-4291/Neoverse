import { users } from "./users.js";
import { supabase } from "../supabase.js";
import { sessionManager } from "../session.js";
import { formatEmailToName } from "../utils.js";
const protectConnection = (io) => {
  io.use(async (socket, next) => {
    const access_token =
      socket.handshake.headers["authorization"]?.split(" ")[1];
    const uid = socket.handshake.query.uid;
    if (!access_token || !uid) {
      ``;
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
    const emit = (eventName, data) => {
      const session = sessionManager.getPlayerSession(
        socket.handshake.query.uid
      );
      if (!session) {
        return;
      }
      const room = session.getPlayerRoom(socket.handshake.query.uid);
      const players = session.getPlayersInRoom(room);
      for (const player of players) {
        if (player.socketId === socket.id) {
          continue;
        }
        io.to(player.socketId).emit(eventName, data);
      }
    };
    const emitToSocketIds = (socketIds, eventName, data) => {
      for (const socketId of socketIds) {
        io.to(socketId).emit(eventName, data);
      }
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
        .select("*")
        .eq("id", realmData.realmId)
        .single();

      if (error || !realm) {
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
          sessionManager.createSession(realmData.realmId, realm.map_data);
        }

        const currentSession = sessionManager.getPlayerSession(uid);

        const user = users.getUsers(uid);
        const username = formatEmailToName(user.user.email);
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
      };
      if (realm.owner_id === socket.handshake.query.uid) {
        return join();
      }

      if (realm.share_id === realmData.shareId) {
        return join();
      } else {
        return rejectJoin("The share link has been changed.");
      }
    });
    on("movePlayer", ({ session, data }) => {
      console.log("player moved");

      const player = session.getPlayer(socket.handshake.query.uid);
      const changedPlayers = session.movePlayer(player.uid, data.x, data.y);

      emit("playerMoved", {
        uid: player.uid,
        x: player.x,
        y: player.y,
      });

      for (const uid of changedPlayers) {
        const changedPlayerData = session.getPlayer(uid);

        emitToSocketIds([changedPlayerData.socketId], "proximityUpdate", {
          proximityId: changedPlayerData.proximityId,
        });
      }
    });
    on("disconnect", ({ session, data }) => {
      const uid = socket.handshake.query.uid;
      const socketIds = sessionManager.getSocketIdsInRoom(
        session.id,
        session.getPlayerRoom(uid)
      );
      const success = sessionManager.logOutBySocketId(socket.id);
      if (success) {
        emitToSocketIds(socketIds, "playerLeftRoom", uid);
        users.removeUser(uid);
      }
    });
  });
};
