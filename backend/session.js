export class SessionManager {
  constructor() {
    this.sessions = {}; // { realmId: Session }
    this.playerIdToRealmId = {}; // { playerId: realmId }
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
