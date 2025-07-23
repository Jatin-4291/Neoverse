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
type Sheets = {
  [key in "ground"]?: PIXI.Spritesheet;
};
class Sprites {
  public sheets: Sheets = {};
  public async load() {
    if (!groundSpriteSheetData) {
      throw new Error(`Sprite sheet not found`);
    }
    if (this.sheets["ground"]) {
      return;
    }
    await PIXI.Assets.load(groundSpriteSheetData.url);
    this.sheets["ground"] = new PIXI.Spritesheet(
      PIXI.Texture.from(groundSpriteSheetData.url),
      this.getSpriteSheetData(groundSpriteSheetData)
    );
    await this.sheets["ground"].parse();
  }
  public getSprite(sheetName: "ground", spriteName: string) {
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

  public getSpriteData = (sheetname: "ground", spriteName: string) => {
    if (!groundSpriteSheetData) {
      throw new Error(`Sprite sheet ${sheetname} not found`);
    }
    if (!groundSpriteSheetData.sprites[spriteName]) {
      throw new Error(`Sprite ${spriteName} not found in sheet ${sheetname}`);
    }
    return groundSpriteSheetData.sprites[spriteName];
  };

  public async getSpriteForTileJSON(tileName: string) {
    const [sheetName, spriteName] = tileName.split("-");
    this.load();
    return {
      sprite: this.getSprite(sheetName as "ground", spriteName),
      data: this.getSpriteData(sheetName as "ground", spriteName),
    };
  }
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
