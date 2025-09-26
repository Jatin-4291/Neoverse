import React from "react";
import Image from "next/image";
type AnimatedCharacterProps = {
  src: string;
  className?: string;
  noAnimation?: boolean;
};

const AnimatedCharacter: React.FC<AnimatedCharacterProps> = ({
  src,
  className,
  noAnimation,
}) => {
  return (
    <div className={`relative aspect-square w-20 overflow-hidden ${className}`}>
      <div
        className={
          noAnimation ? "static-character-container" : "character-container"
        }
      >
        <Image
          src={src}
          alt="character"
          style={{ imageRendering: "pixelated" }}
          className={noAnimation ? "static-character" : "character"}
          fill
        />
      </div>
    </div>
  );
};

export default AnimatedCharacter;
