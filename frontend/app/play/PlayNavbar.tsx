import React from "react";
import { ArrowLeftEndOnRectangleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import MicAndCameraButtons from "@/components/VideoChat/MicAndCameraButtons";
import { useVideoChat } from "../hooks/useVideoChat";
import AnimatedCharacter from "./SkinMenu/AnimatedCharacter";
import { useEffect } from "react";

import { videoChat } from "@/video-chat/video-chat";
type PlayNavbarProps = {
  username: string;
  skin: string;
};

const PlayNavbar: React.FC<PlayNavbarProps> = ({ username }) => {
  const { isCameraMuted } = useVideoChat();
  // function onClickSkinButton() {
  //   setModal("Skin");
  //   signal.emit("requestSkin");
  // }

  useEffect(() => {
    videoChat.playVideoTrackAtElementId("local-video");
  }, []);

  return (
    <div className="bg-[#282D4E] w-48 h-52 ml-4 border rounded-2xl absolute bottom-10 flex items-start p-2 gap-4 select-none flex-col">
      {/* Back Link */}
      <Link
        href="/app"
        className="aspect-square grid place-items-center rounded-lg p-1 outline-none bg-gray-800 hover:bg-gray-700 animate-colors"
      >
        <ArrowLeftEndOnRectangleIcon className="h-8 w-8" />
      </Link>

      {/* Camera + User Info */}
      <div className="flex items-center gap-3">
        {/* Camera Circle */}
        <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-light-gray grid place-items-center bg-grey-800">
          {/* Character / avatar */}
          <AnimatedCharacter
            src="/sprites/characters/Character_009.png"
            noAnimation
            className="w-10 h-10 absolute bottom-1"
          />
          {/* Video */}
          <div
            id="local-video"
            className={`w-full h-full absolute top-0 left-0 rounded-full ${
              !isCameraMuted ? "block" : "hidden"
            }`}
          ></div>
          {/* Camera Mute Toggle Button */}
        </div>

        {/* Username & Status */}
        <div className="flex flex-col">
          <p className="text-white font-semibold text-sm">{username}</p>
          <p className="text-gray-400 text-xs">Available</p>
        </div>
      </div>

      {/* Mic & Camera Buttons */}
      <MicAndCameraButtons />
    </div>
  );
};

export default PlayNavbar;
