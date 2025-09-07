/* eslint-disable @typescript-eslint/no-explicit-any */

import { grasslandsSpriteSheetData } from "./grasslands";
import { villageSpriteSheetData } from "./village";
import { groundSpriteSheetData } from "./ground";
import * as PIXI from "pixi.js";
import { SpriteSheetData } from "./spriteSheetData";
import { Layer } from "../types";
export interface SpriteSheetTile {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  layer?: Layer;
  colliders?: Collider[];
}
export type Collider = {
  x: number;
  y: number;
};
export type SheetName = "ground" | "grasslands" | "village";
type Sheets = {
  [key in SheetName]?: PIXI.Spritesheet;
};
class Sprites {
  public spriteSheetDataSet: { [key in SheetName]: SpriteSheetData } = {
    ground: groundSpriteSheetData,
    grasslands: grasslandsSpriteSheetData,
    village: villageSpriteSheetData,
  };
  public sheets: Sheets = {};
  public async load(sheetName: SheetName) {
    if (!this.spriteSheetDataSet[sheetName]) {
      throw new Error(`Sprite sheet not found`);
    }

    if (this.sheets[sheetName]) {
      return;
    }

    await PIXI.Assets.load(this.spriteSheetDataSet[sheetName].url);
    this.sheets[sheetName] = new PIXI.Spritesheet(
      PIXI.Texture.from(this.spriteSheetDataSet[sheetName].url),
      this.getSpriteSheetData(this.spriteSheetDataSet[sheetName])
    );
    await this.sheets[sheetName].parse();
  }
  public async getSpriteForTileJSON(tileName: string) {
    const [sheetName, spriteName] = tileName.split("-");
    await this.load(sheetName as SheetName);
    return {
      sprite: this.getSprite(sheetName as SheetName, spriteName),
      data: this.getSpriteData(sheetName as SheetName, spriteName),
    };
  }
  public getSprite(sheetName: SheetName, spriteName: string) {
    const sheet = this.sheets[sheetName];

    if (!sheet) {
      throw new Error(`Sprite sheet ${sheetName} not found`);
    }
    const sprite = sheet.textures[spriteName];

    if (!sprite) {
      throw new Error(`Sprite ${spriteName} not found in sheet ${sheetName}`);
    }
    const spriteInstance = new PIXI.Sprite(sprite);
    return spriteInstance;
  }
  public getSpriteData = (sheetname: SheetName, spriteName: string) => {
    if (!this.spriteSheetDataSet[sheetname]) {
      throw new Error(`Sprite sheet ${sheetname} not found`);
    }
    if (!this.spriteSheetDataSet[sheetname].sprites[spriteName]) {
      throw new Error(`Sprite ${spriteName} not found in sheet ${sheetname}`);
    }
    return this.spriteSheetDataSet[sheetname].sprites[spriteName];
  };

  private getSpriteSheetData(sheetData: SpriteSheetData) {
    const spriteSheetData = {
      frames: {} as any,
      meta: {
        scale: "1",
        format: "RGBA8888",
        image: sheetData.url,
        size: {
          w: sheetData.width,
          h: sheetData.height,
        },
      },
      animation: {},
    };
    for (const sprite of sheetData.spritesList) {
      spriteSheetData.frames[sprite.name] = {
        frame: {
          x: sprite.x,
          y: sprite.y,
          w: sprite.width,
          h: sprite.height,
        },
        spriteSourceSize: {
          x: 0,
          y: 0,
          w: sprite.width,
          h: sprite.height,
        },
        sourceSize: {
          w: sprite.width,
          h: sprite.height,
        },
        anchor: {
          x: 0,
          y: 1 - 32 / sprite.height,
        },
      };
    }
    return spriteSheetData;
  }
}
const sprites = new Sprites();
export { sprites };
