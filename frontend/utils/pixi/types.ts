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
export interface ColliderMap {
  [key: TilePoint]: boolean;
}
export type Coordinate = [number, number];
export type AnimationState =
  | "idle_down"
  | "idle_up"
  | "idle_left"
  | "idle_right"
  | "walk_down"
  | "walk_up"
  | "walk_left"
  | "walk_right";

export type Direction = "down" | "up" | "left" | "right";
export type Layer = "floor" | "above_floor" | "object";
