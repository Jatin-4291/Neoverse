"use client";
import Link from "next/link";
import BasicButton from "@/components/BasicButton";

export default function Index() {
  return (
    <div className="w-full h-screen bg-gradient-to-br from-blue-300 via-blue-200 to-white flex items-center justify-center p-4">
      <div className="max-w-[700px] w-full text-center bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-10 space-y-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 tracking-tight">
          Welcome to <span className="text-blue-600">NeoVerse</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-700">
          A functional 2D metaverse inspired by Gather — built to showcase my
          technical skills and passion for immersive, social virtual spaces.
        </p>

        <div className="flex justify-center">
          <Link href="/app">
            <BasicButton className="text-lg px-6 py-3 bg-blue-500 hover:bg-blue-600 cursor-pointer">
              Get Started
            </BasicButton>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center text-sm gap-3 text-gray-600 pt-4 border-t border-gray-300">
          <p>Created by jatin dua</p>
          <span className="hidden md:inline">|</span>
        </div>
      </div>
    </div>
  );
}
