/* eslint-disable @typescript-eslint/no-explicit-any */

import { TilePoint, Point, RealmData, SpriteMap } from "./types";
import * as PIXI from "pixi.js";
import { gsap } from "gsap";
import { Player } from "./Player/Player";
import { App } from "./App";
import signal from "../signal";
import { server } from "../backend/server";
export class PlayApp extends App {
  private scale: number = 1.5;
  public player: Player;
  public blocked: Set<TilePoint> = new Set();
  public keysDown: string[] = [];
  private teleportLocations: Point | null = null;
  private fadeOverlay: PIXI.Graphics = new PIXI.Graphics();
  private fadeDuration: number = 0.5;
  public uid: string = "";
  public realmId: string = "";
  public players: { [key: string]: Player } = {};
  private disableInput: boolean = false;
  private kicked: boolean = false;

  private fadeTiles: SpriteMap = {};
  private fadeTileContainer: PIXI.Container = new PIXI.Container();
  private fadeAnimation: gsap.core.Tween | null = null;
  private currentPrivateAreaTiles: TilePoint[] = [];
  public proximityId: string | null = null;
  constructor(
    uid: string,
    realmId: string,
    realmData: RealmData,
    username: string,
    skin: string = "009"
  ) {
    super(realmData);
    this.uid = uid;
    this.realmId = realmId;
    this.player = new Player(skin, this, username, true);
  }
  public async init() {
    await super.init();
    await this.loadAssets();
    await this.loadRoom(this.realmData.spawnpoint.roomIndex);
    this.app.stage.eventMode = "static";
    this.setScale(this.scale);
    this.app.renderer.on("resize", this.resizeEvent);
    this.fadeTileContainer.alpha = 0;
    this.app.stage.addChild(this.fadeTileContainer);
    this.clickEvents();
    this.setUpKeyboardEvents();
    this.setUpFadeOverlay();
    this.setUpSignalListeners();
    this.setUpSocketEvents();
    this.fadeOut();
  }
  private resizeEvent = () => {
    this.moveCameraToPlayer();
  };
  private async loadAssets() {
    await Promise.all([
      PIXI.Assets.load("/fonts/silkscreen.ttf"),
      PIXI.Assets.load("/fonts/nunito.ttf"),
      PIXI.Assets.load("/faded-tile.png"),
    ]);
  }
  private setScale = (newScale: number) => {
    this.scale = newScale;
    this.app.stage.scale.set(this.scale);
  };
  private setUpSignalListeners = () => {
    signal.on("requestSkin", this.onRequestSkin);
    signal.on("switchSkin", this.onSwitchSkin);
    // signal.on("disableInput", this.onDisableInput);
    // signal.on("message", this.onMessage);
    signal.on("getSkinForUid", this.getSkinForUid);
  };
  private removeSignalListeners = () => {
    signal.off("requestSkin", this.onRequestSkin);
    signal.off("switchSkin", this.onSwitchSkin);
    // signal.off("disableInput", this.onDisableInput);
    // signal.off("message", this.onMessage);
    signal.off("getSkinForUid", this.getSkinForUid);
  };
  private onRequestSkin = () => {
    signal.emit("skin", this.player.skin);
  };

  private onSwitchSkin = (skin: string) => {
    // this.player.changeSkin(skin);
    server.socket?.emit("changedSkin", skin);
  };

  private getSkinForUid = (uid: string) => {
    const player = this.players[uid];
    if (!player) return;

    signal.emit("video-skin", {
      skin: player.skin,
      uid: uid,
    });
  };

  private setUpSocketEvents = () => {
    server.socket?.on("playerLeftRoom", this.onPlayerLeftRoom);
    server.socket?.on("playerJoinedRoom", this.onPlayerJoinedRoom);
    server.socket?.on("playerMoved", this.onPlayerMoved);
    // server.socket?.on("playerTeleported", this.onPlayerTeleported);
    // server.socket?.on("playerChangedSkin", this.onPlayerChangedSkin);
    // server.socket?.on("receiveMessage", this.onReceiveMessage);
    // server.socket?.on("disconnect", this.onDisconnect);
    // server.socket?.on("kicked", this.onKicked);
    server.socket?.on("proximityUpdate", this.onProximityUpdate);
  };
  private onProximityUpdate = (data: any) => {
    this.proximityId = data.proximityId;
    console.log(this.proximityId);

    if (this.proximityId) {
      this.player.checkIfShouldJoinChannel(this.player.currentTilePosition);
    }
  };
  private onPlayerLeftRoom = (uid: string) => {
    if (this.players[uid]) {
      this.players[uid].destroy();
      this.layers.object.removeChild(this.players[uid].parent);
      delete this.players[uid];
    }
  };
  override async loadRoom(index: number) {
    // Load the room data and initialize the player
    this.players = {};
    await super.loadRoom(index);
    this.setUpBlockedTiles();
    this.setUpFadeTiles();
    this.spawnLocalPlayer();
    await this.syncOtherPlayers();
    // this.displayInitialChatMessage();
  }
  private setUpBlockedTiles() {
    this.blocked = new Set<TilePoint>();

    for (const [key, value] of Object.entries(
      this.realmData.rooms[this.currentRoomIndex].tilemap
    )) {
      if (value.impassable) {
        this.blocked.add(key as TilePoint);
      }
    }
    for (const [key, value] of Object.entries(this.collidersFromSpritesMap)) {
      if (value) {
        this.blocked.add(key as TilePoint);
      }
    }
  }
  private setUpFadeOverlay = () => {
    this.fadeOverlay.rect(
      0,
      0,
      this.app.screen.width * (1 / this.scale),
      this.app.screen.height * (1 / this.scale)
    );
    this.fadeOverlay.fill(0x0f0f0f);
    this.app.stage.addChild(this.fadeOverlay);
  };
  private async syncOtherPlayers() {
    const { data, error } = await server.getPlayersInRoom(
      this.currentRoomIndex
    );

    if (error) {
      console.error("Failed to get player positions in room:", error);
      return;
    }

    for (const player of data.players) {
      if (player.uid === this.uid) continue;
      this.updatePlayer(player.uid, player);
    }

    this.sortObjectsByY();
  }
  private setUpFadeTiles() {
    this.fadeTiles = {};
    this.fadeTileContainer.removeChildren();
    for (const [key] of Object.entries(
      this.realmData.rooms[this.currentRoomIndex].tilemap
    )) {
      const [x, y] = key.split(",").map(Number);
      const screenCoordinates = this.convertTileToScreenCoordinates(x, y);
      const tile: PIXI.Sprite = new PIXI.Sprite(
        PIXI.Assets.get("/faded-tile.png")
      );
      tile.x = screenCoordinates.x;
      tile.y = screenCoordinates.y;
      this.fadeTileContainer.addChild(tile);
      this.fadeTiles[key as TilePoint] = tile;
    }
  }
  private spawnLocalPlayer = async () => {
    await this.player.init();
    if (this.teleportLocations) {
      this.player.setPosition(
        this.teleportLocations.x,
        this.teleportLocations.y
      );
    } else {
      this.player.setPosition(
        this.realmData.spawnpoint.x,
        this.realmData.spawnpoint.y
      );
    }
    this.layers.object.addChild(this.player.parent);
    this.moveCameraToPlayer();
  };
  public moveCameraToPlayer = () => {
    const x = this.player.parent.x - this.app.screen.width / 2 / this.scale;
    const y = this.player.parent.y - this.app.screen.height / 2 / this.scale;
    this.app.stage.pivot.set(x, y);
    this.updateFadeOverlay(x, y);
  };
  private updateFadeOverlay = (x: number, y: number) => {
    this.fadeOverlay.clear();
    this.fadeOverlay.rect(
      0,
      0,
      this.app.screen.width * (1 / this.scale),
      this.app.screen.height * (1 / this.scale)
    );
    this.fadeOverlay.fill(0x0f0f0f);
    this.fadeOverlay.pivot.set(-x, -y);
  };
  private clickEvents = () => {
    this.app.stage.on("pointerdown", (e: PIXI.FederatedPointerEvent) => {
      if (this.player.frozen || this.disableInput) return;

      const clickPosition = e.getLocalPosition(this.app.stage);
      const { x, y } = this.convertScreenToTileCoordinates(
        clickPosition.x,
        clickPosition.y
      );
      this.player.moveToTile(x, y);
      this.player.setMovementMode("mouse");
    });
  };
  private setUpKeyboardEvents = () => {
    document.addEventListener("keydown", this.keydown);
    document.addEventListener("keyup", this.keyup);
  };
  private keydown = (event: KeyboardEvent) => {
    if (this.keysDown.includes(event.key) || this.disableInput) return;
    this.player.keydown(event);

    this.keysDown.push(event.key);
  };

  private keyup = (event: KeyboardEvent) => {
    this.keysDown = this.keysDown.filter((key) => key !== event.key);
  };
  private fadeOut = () => {
    PIXI.Ticker.shared.add(this.fadeOutTicker);
  };
  private fadeOutTicker = ({ deltaTime }: { deltaTime: number }) => {
    this.fadeOverlay.alpha -= deltaTime / 60 / this.fadeDuration;
    if (this.fadeOverlay.alpha <= 0) {
      this.fadeOverlay.alpha = 0;
      PIXI.Ticker.shared.remove(this.fadeOutTicker);
    }
  };
  private removeEvents = () => {
    // this.removeSocketEvents();
    // this.destroyPlayers();
    // server.disconnect();

    PIXI.Ticker.shared.destroy();

    // this.removeSignalListeners();
    document.removeEventListener("keydown", this.keydown);
    document.removeEventListener("keyup", this.keyup);
  };
  private async spawnPlayer(
    uid: string,
    skin: string,
    username: string,
    x: number,
    y: number
  ) {
    const otherPlayer = new Player(skin, this, username);
    await otherPlayer.init();
    otherPlayer.setPosition(x, y);
    this.layers.object.addChild(otherPlayer.parent);
    this.players[uid] = otherPlayer;
    this.sortObjectsByY();
  }
  private async updatePlayer(uid: string, player: any) {
    if (uid in this.players) {
      if (
        this.players[uid].currentTilePosition.x !== player.x ||
        this.players[uid].currentTilePosition.y !== player.y
      ) {
        this.players[uid].setPosition(player.x, player.y);
      }
    } else {
      await this.spawnPlayer(
        player.uid,
        player.skin,
        player.username,
        player.x,
        player.y
      );
    }
  }
  private onPlayerJoinedRoom = (playerData: any) => {
    console.log("Player joined room:", playerData);
    this.updatePlayer(playerData.uid, playerData);
  };
  private onPlayerMoved = (data: any) => {
    if (this.blocked.has(`${data.x}, ${data.y}`)) return;
    const player = this.players[data.uid];

    if (player) {
      player.moveToTile(data.x, data.y);
    }
  };
  public destroy() {
    this.removeEvents();
    super.destroy();
  }
}
