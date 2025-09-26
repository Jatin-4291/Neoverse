"use client";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

import BasicButton from "@/components/BasicButton";
import DesktopRealmItem from "./DesktopRealmItem";
import { createClient } from "@/utils/supabase/client";
import revalidate from "@/utils/revalidate";
import { request } from "@/utils/backend/request";

type Realm = {
  id: string;
  name: string;
  share_id: string;
  shared?: boolean;
};

type RealmsMenuProps = {
  realms: Realm[];
  visitedRealms: Realm[];
  errorMessage: string;
};

const RealmsMenu: React.FC<RealmsMenuProps> = ({
  visitedRealms,
  realms,
  errorMessage,
}) => {
  const [selectedRealm, setSelectedRealm] = useState<Realm | null>(null);
  const [playerCounts, setPlayerCounts] = useState<number[]>([]);
  const router = useRouter();
  const supabase = createClient();

  /** Show error toast if errorMessage is passed */
  useEffect(() => {
    if (errorMessage) console.log(errorMessage);
  }, [errorMessage]);

  /** Fetch player counts on mount + trigger revalidation */
  const fetchPlayerCounts = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const { data, error } = await request(
      "/getPlayerCounts",
      { realmIds: realms.map((realm) => realm.id) },
      session.access_token
    );

    if (data) setPlayerCounts(data.playerCounts);
    if (error) toast.error("Failed to load player counts.");
  }, [realms, supabase]);

  useEffect(() => {
    fetchPlayerCounts();
    revalidate("/play/[id]");
  }, [fetchPlayerCounts]);

  const getLink = () =>
    selectedRealm
      ? `/play/${selectedRealm.id}${
          selectedRealm.share_id ? `?shareId=${selectedRealm.share_id}` : ""
        }`
      : "#";

  /** Fetch player counts for all realms */

  /** Reusable component for rendering mobile buttons */
  const RealmButton: React.FC<{ realm: Realm; count?: number }> = ({
    realm,
    count,
  }) => (
    <BasicButton
      key={realm.id}
      className={`w-full h-12px-4 py-3 rounded-xl flex items-center justify-between 
        transition-all duration-200 shadow-sm
        ${
          selectedRealm?.id === realm.id
            ? "border-2 border-blue-400 bg-slate-800/80"
            : "border border-slate-600 bg-slate-900/60 hover:bg-slate-800/70"
        }`}
      onClick={() => setSelectedRealm(realm)}
    >
      <p className="text-base font-medium text-white">{realm.name}</p>
      {count !== undefined && (
        <div
          className="rounded-full w-9 h-9 flex items-center justify-center 
          font-bold text-sm bg-green-500/90 text-white shadow-md"
        >
          {count}
        </div>
      )}
    </BasicButton>
  );

  return (
    <>
      {/* -------------------- Mobile View -------------------- */}
      <div className="flex flex-col items-center p-4 gap-2 sm:hidden">
        {realms.length === 0 ? (
          <p className="text-center text-slate-400">
            You have no spaces to join. Create a space on Desktop to get
            started!
          </p>
        ) : (
          <div className="w-full">
            <p className="text-center font-semibold text-slate-100 mb-2">
              Owned Spaces
            </p>
            {realms.map((realm, i) => (
              <RealmButton
                key={realm.id}
                realm={realm}
                count={playerCounts[i]}
              />
            ))}
          </div>
        )}

        {visitedRealms.length > 0 && (
          <div className="w-full mt-4">
            <p className="text-center font-semibold text-slate-100 mb-2">
              Shared Spaces
            </p>
            {visitedRealms.map((realm, i) => (
              <RealmButton
                key={realm.id}
                realm={realm}
                count={playerCounts[i]}
              />
            ))}
          </div>
        )}

        {/* Sticky bottom bar */}
        <div
          className="fixed bottom-0 w-full 
    backdrop-blur-md bg-slate-900/85 
    border-t border-slate-700 shadow-inner 
    grid place-items-center p-3"
        >
          <BasicButton
            className="w-[90%] text-base py-3 rounded-xl 
      bg-indigo-600 hover:bg-indigo-700 
      transition-all shadow-md font-semibold text-white"
            disabled={!selectedRealm}
            onClick={() => router.push(getLink())}
          >
            Join Space
          </BasicButton>
        </div>
      </div>

      {/* -------------------- Desktop View -------------------- */}
      <div className="flex-col items-center w-full p-8 hidden sm:flex ">
        {realms.length === 0 && (
          <p className="text-center text-slate-400">
            You have no owned spaces. Create one to get started!
          </p>
        )}

        {realms.length > 0 && (
          <p className="mb-4 text-base font-semibold text-slate-100">
            Owned Spaces
          </p>
        )}
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 gap-6 w-full">
          {realms.map((realm, i) => (
            <div
              key={realm.id}
              className="rounded-xl p-4 bg-slate-800/80 border border-slate-700 
        shadow-md hover:shadow-lg hover:scale-[1.02] 
        transition-transform duration-200"
            >
              <DesktopRealmItem
                name={realm.name}
                id={realm.id}
                shareId={realm.share_id}
                shared={realm.shared}
                playerCount={playerCounts[i]}
              />
            </div>
          ))}
        </div>

        {visitedRealms.length > 0 && (
          <>
            <p className="mt-12 mb-4 text-lg font-semibold text-slate-100">
              Shared Spaces
            </p>
            <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 gap-6 w-full">
              {visitedRealms.map((realm, i) => (
                <div
                  key={realm.id}
                  className="rounded-xl p-4 bg-slate-800/80 border border-slate-700 
            shadow-md hover:shadow-lg hover:scale-[1.02] 
            transition-transform duration-200"
                >
                  <DesktopRealmItem
                    name={realm.name}
                    id={realm.id}
                    shareId={realm.share_id}
                    shared={realm.shared}
                    playerCount={playerCounts[i]}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default RealmsMenu;
