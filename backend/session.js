export class SessionManager {
  constructor() {
    this.sessions = {}; // { realmId: Session }
    this.playerIdToRealmId = {}; // { playerId: realmId }`
    this.socketIdToPlayerId = {}; // { socketId: playerId }
  }

  createSession(id, mapData) {
    const realm = new Session(id, mapData);
    this.sessions[id] = realm;
  }

  getSession(id) {
    return this.sessions[id];
  }

  getPlayerSession(uid) {
    const realmId = this.playerIdToRealmId[uid];
    return this.sessions[realmId];
  }

  addPlayerToSession(socketId, realmId, uid, username, skin) {
    this.sessions[realmId].addPlayer(socketId, uid, username, skin);
    this.playerIdToRealmId[uid] = realmId;
    this.socketIdToPlayerId[socketId] = uid;
  }

  logOutPlayer(uid) {
    const realmId = this.playerIdToRealmId[uid];
    if (!realmId) return;

    const player = this.sessions[realmId].getPlayer(uid);
    delete this.socketIdToPlayerId[player.socketId];
    delete this.playerIdToRealmId[uid];
    this.sessions[realmId].removePlayer(uid);
  }

  getSocketIdsInRoom(realmId, roomIndex) {
    return this.sessions[realmId]
      .getPlayersInRoom(roomIndex)
      .map((player) => player.socketId);
  }
  logOutBySocketId(socketId) {
    const uid = this.socketIdToPlayerId[socketId];
    if (!uid) return false;

    this.logOutPlayer(uid);
    return true;
  }

  terminateSession(id, reason) {
    const session = this.sessions[id];
    if (!session) return;

    const players = session.getPlayerIds();
    players.forEach((player) => {
      kickPlayer(player, reason); // assumes kickPlayer is defined elsewhere
    });

    delete this.sessions[id];
  }
}
import { v4 as uuidv4 } from "uuid";

class Session {
  constructor(id, mapData) {
    this.playerRooms = {}; // { roomIndex: Set<string> }
    this.playerPositions = {}; // { roomIndex: { coordKey: Set<string> } }
    this.players = {}; // { uid: Player }
    this.id = id;
    this.map_data = mapData;

    for (let i = 0; i < mapData.rooms.length; i++) {
      this.playerRooms[i] = new Set();
      this.playerPositions[i] = {};
    }
  }

  addPlayer(socketId, uid, username, skin) {
    this.removePlayer(uid);

    const spawnIndex = this.map_data.spawnpoint.roomIndex;
    const spawnX = this.map_data.spawnpoint.x;
    const spawnY = this.map_data.spawnpoint.y;

    const player = {
      uid,
      username,
      x: spawnX,
      y: spawnY,
      room: spawnIndex,
      socketId,
      skin,
      proximityId: null,
    };

    this.playerRooms[spawnIndex].add(uid);
    const coordKey = `${spawnX}, ${spawnY}`;
    if (!this.playerPositions[spawnIndex][coordKey]) {
      this.playerPositions[spawnIndex][coordKey] = new Set();
    }
    this.playerPositions[spawnIndex][coordKey].add(uid);
    this.players[uid] = player;
  }

  removePlayer(uid) {
    if (!this.players[uid]) return;

    const player = this.players[uid];
    this.playerRooms[player.room].delete(uid);

    const coordKey = `${player.x}, ${player.y}`;
    delete this.playerPositions[player.room][coordKey];

    delete this.players[uid];
  }

  changeRoom(uid, roomIndex, x, y) {
    if (!this.players[uid]) return [];

    const player = this.players[uid];

    this.playerRooms[player.room].delete(uid);
    this.playerRooms[roomIndex].add(uid);

    const coordKey = `${player.x}, ${player.y}`;
    if (this.playerPositions[player.room][coordKey]) {
      this.playerPositions[player.room][coordKey].delete(uid);
    }

    player.room = roomIndex;
    return this.movePlayer(uid, x, y);
  }

  getPlayersInRoom(roomIndex) {
    return Array.from(this.playerRooms[roomIndex] || []).map(
      (uid) => this.players[uid]
    );
  }

  getRoomWithChannelId(channelId) {
    const index = this.map_data.rooms.findIndex(
      (room) => room.channelId === channelId
    );
    return index !== -1 ? index : null;
  }

  getPlayerCount() {
    return Object.keys(this.players).length;
  }

  getPlayer(uid) {
    return this.players[uid];
  }

  getPlayerIds() {
    return Object.keys(this.players);
  }

  getPlayerRoom(uid) {
    return this.players[uid].room;
  }

  movePlayer(uid, x, y) {
    const oldCoordKey = `${this.players[uid].x}, ${this.players[uid].y}`;
    if (this.playerPositions[this.players[uid].room][oldCoordKey]) {
      this.playerPositions[this.players[uid].room][oldCoordKey].delete(uid);
    }

    this.players[uid].x = x;
    this.players[uid].y = y;

    const coordKey = `${x}, ${y}`;
    if (!this.playerPositions[this.players[uid].room][coordKey]) {
      this.playerPositions[this.players[uid].room][coordKey] = new Set();
    }

    this.playerPositions[this.players[uid].room][coordKey].add(uid);

    return this.setProximityIdsWithPlayer(uid);
  }

  setProximityIdsWithPlayer(uid) {
    const player = this.players[uid];
    const proximityTiles = this.getProximityTiles(player.x, player.y);
    const changedPlayers = new Set();
    const originalProximityId = player.proximityId;
    let otherPlayersExist = false;

    for (const tile of proximityTiles) {
      const playersInTile = this.playerPositions[player.room][tile];
      if (!playersInTile) continue;

      for (const otherUid of playersInTile) {
        if (otherUid === uid) continue;
        otherPlayersExist = true;

        const otherPlayer = this.players[otherUid];
        if (otherPlayer.proximityId === null) {
          if (player.proximityId === null) {
            player.proximityId = uuidv4();
            if (player.proximityId !== originalProximityId) {
              changedPlayers.add(uid);
            }
          }
          otherPlayer.proximityId = player.proximityId;
          changedPlayers.add(otherUid);
        } else if (player.proximityId !== otherPlayer.proximityId) {
          player.proximityId = otherPlayer.proximityId;
          if (player.proximityId !== originalProximityId) {
            changedPlayers.add(uid);
          }
        }
      }
    }

    if (!otherPlayersExist) {
      player.proximityId = null;
      if (originalProximityId !== null) {
        changedPlayers.add(uid);
      }
    }

    return Array.from(changedPlayers);
  }

  getProximityTiles(x, y) {
    const proximityTiles = [];
    const range = 3;

    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        proximityTiles.push(`${x + dx}, ${y + dy}`);
      }
    }
    return proximityTiles;
  }
}
export const sessionManager = new SessionManager();
export { Session };
