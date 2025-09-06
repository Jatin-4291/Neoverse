"use client";
import React from "react";
import BasicButton from "@/components/BasicButton";
import AnimatedCharacter from "./SkinMenu/AnimatedCharacter";
import { useVideoChat } from "../hooks/useVideoChat";
import MicAndCameraButtons from "@/components/VideoChat/MicAndCameraButtons";

type IntroScreenProps = {
  realmName: string;
  skin: string;
  username: string;
  setShowIntroScreen: (show: boolean) => void;
};

const IntroScreen: React.FC<IntroScreenProps> = ({
  realmName,
  skin,
  username,
  setShowIntroScreen,
}) => {
  console.log(skin);

  const src = "/sprites/characters/Character_009.png";

  return (
    <main
      className="w-full h-screen flex flex-col items-center pt-28 
  bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] text-white"
    >
      <h1 className="text-5xl font-bold tracking-wide drop-shadow-md">
        Welcome to <span className="text-[#60a5fa]">{realmName}</span>
      </h1>

      <section className="flex flex-row mt-32 items-center gap-28">
        {/* Local Video */}
        <div className="flex flex-col items-center gap-6">
          <div
            className="aspect-video w-[360px] h-[240px] 
        rounded-2xl overflow-hidden 
        bg-white/10 backdrop-blur-md border border-white/20 shadow-lg"
          >
            <LocalVideo />
          </div>
          <MicAndCameraButtons />
        </div>

        {/* Avatar + Join */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-row items-center gap-4">
            <AnimatedCharacter src={src} noAnimation />
            <p className="text-lg text-gray-300 font-medium">{username}</p>
          </div>

          <BasicButton
            className="py-3 px-16 w-[260px] text-lg font-semibold 
        bg-gradient-to-r from-indigo-500 to-blue-600 
        hover:scale-105 transition-all duration-200 rounded-2xl shadow-lg"
            onClick={() => setShowIntroScreen(false)}
          >
            Join Realm
          </BasicButton>
        </div>
      </section>
    </main>
  );
};

export default IntroScreen;

function LocalVideo() {
  const { isCameraMuted, isMicMuted } = useVideoChat();

  return (
    <div className="w-full h-full bg-[#0f172a] grid place-items-center relative">
      <div id="local-video" className="w-full h-full"></div>

      {/* Overlay messages */}
      <div className="absolute select-none text-sm text-gray-200 flex flex-col gap-1 items-center">
        {isMicMuted && isCameraMuted && (
          <span className="px-3 py-1 rounded-full bg-black/60 text-xs">
            You are muted
          </span>
        )}
        {isCameraMuted && (
          <span className="px-3 py-1 rounded-full bg-black/60 text-xs">
            Camera off
          </span>
        )}
      </div>

      {isMicMuted && !isCameraMuted && (
        <span
          className="absolute bottom-3 right-3 select-none text-xs text-gray-100 
          bg-black/70 px-3 py-1 rounded-full"
        >
          You are muted
        </span>
      )}
    </div>
  );
}
