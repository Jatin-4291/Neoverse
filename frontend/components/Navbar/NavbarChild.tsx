"use client";
import React from "react";
import Image from "next/image";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { useModal } from "@/app/hooks/useModal";
import BasicButton from "../BasicButton";

type NavbarChildProps = {
  name: string;
  avatar_url: string;
};

export const NavbarChild: React.FC<NavbarChildProps> = ({
  name,
  avatar_url,
}) => {
  const { setModal } = useModal();

  return (
    <header className="fixed top-0 w-full z-50 bg-gradient-to-b from-[#0F172A] to-[#1E293B] text-white shadow-md h-16">
      <div className="flex items-center justify-between h-full px-6 sm:px-10">
        {/* Create Space Button - visible on sm and up */}
        <BasicButton
          onClick={() => {
            setModal("Create Realm");
          }}
          className="hidden w-32 h-12 sm:flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 transition-all px-4 py-2 rounded-md font-medium cursor-pointer"
        >
          Create Space
          <PlusCircleIcon className="h-8 w-8" />
        </BasicButton>

        {/* Avatar and Name */}
        <div
          className="flex items-center gap-3 hover:bg-[#334155] transition-colors duration-150 rounded-full cursor-pointer px-2 py-1 select-none"
          onClick={() => setModal("Account Dropdown")}
        >
          <p className="text-sm sm:text-base font-medium truncate max-w-[120px]">
            {name}
          </p>
          <Image
            alt="avatar"
            src={avatar_url}
            width={36}
            height={36}
            className="rounded-full aspect-square object-cover"
            unoptimized
          />
        </div>
      </div>
    </header>
  );
};
