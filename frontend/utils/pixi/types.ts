import { RealmDataSchema, RoomSchema } from "./zod";
import { z } from "zod";
import { Sprite } from "pixi.js";

export type TilePoint = `${number}, ${number}`;
export type RealmData = z.infer<typeof RealmDataSchema>;
export type Room = z.infer<typeof RoomSchema>;
export type Point = {
  x: number;
  y: number;
};
export interface SpriteMap {
  [key: TilePoint]: Sprite;
}
