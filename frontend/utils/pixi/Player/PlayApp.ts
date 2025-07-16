import { TilePoint, Point,RealmData SpriteMap } from "../types";
import * as PIXI from "pixi.js";
import { gsap } from "gsap";
import { defaultSkin } from "./Player/skins";
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
  constructor(uid: string, realmId: string, realmData: RealmData,
    username:string,
    skin:string='009') {

    this.uid = uid;
    this.realmId = realmId;
    this.player=new Player(skin,this,username,true)
  }
}
