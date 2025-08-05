import { z } from "zod";
const TeleporterSchema = z.object({
  roomIndex: z.number(),
  x: z.number(),
  y: z.number(),
});
const TileSchema = z.object({
  floor: z.string().optional(),
  above_floor: z.string().optional(),
  object: z.string().optional(),
  impassable: z.boolean().optional(),
  teleporter: TeleporterSchema.optional(),
  privateAreaId: z.string().optional(),
});
const TileMapSchema = z.record(
  z.string().regex(/^(-?\d+),(-?\d+)$/),
  TileSchema
);
const RoomSchema = z.object({
  name: z.string(),
  tilemap: TileMapSchema,
  channelId: z.string().optional(),
});
const RealmDataSchema = z.object({
  spawnpoint: z.object({
    x: z.number(),
    y: z.number(),
    roomIndex: z.number(),
  }),
  rooms: z.array(RoomSchema),
});

export { RealmDataSchema, RoomSchema };
