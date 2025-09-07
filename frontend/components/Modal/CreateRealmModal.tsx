/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import Modal from "./Modal";
import { useModal } from "@/app/hooks/useModal";
import BasicButton from "../BasicButton";
import BasicInput from "../BasicInput";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-toastify";
import revalidate from "@/utils/revalidate";
import { removeExtraSpaces } from "@/utils/removeExtraSpaces";
import defaultMap from "@/utils/defaultmap.json";

const CreateRealmModal: React.FC = () => {
  const { modal, setModal } = useModal();

  const [realmName, setRealmName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const [useDefaultMap, setUseDefaultMap] = useState<boolean>(true);

  async function createRealm() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const uid = user.id;

    setLoading(true);

    const realmData: any = {
      owner_id: uid,
      name: realmName,
    };
    if (useDefaultMap) {
      realmData.map_data = defaultMap;
    }

    const { data, error } = await supabase
      .from("realms")
      .insert(realmData)
      .select();

    if (error) {
      toast.error(error?.message);
    }

    if (data) {
      setRealmName("");
      revalidate("/app");
      setModal("None");
      toast.success("Your space has been created!");
    }

    setLoading(false);
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = removeExtraSpaces(e.target.value);
    setRealmName(value);
  }

  return (
    <Modal open={modal === "Create Realm"} closeOnOutsideClick>
      <div className="flex flex-col items-center bg-white rounded-2xl shadow-xl p-6 w-[400px] gap-5">
        <h1 className="text-2xl font-semibold text-gray-800">Create a Space</h1>
        <div className="flex flex-row gap-2">
          <p className="text-sm text-gray-700 mt-10">Enter Space Name</p>
          <BasicInput
            label="Space Name"
            className="w-full"
            value={realmName}
            onChange={onChange}
            maxLength={32}
          />
        </div>

        <div className="flex items-center gap-3 w-full">
          <input
            type="checkbox"
            id="useDefaultMap"
            checked={useDefaultMap}
            onChange={(e) => setUseDefaultMap(e.target.checked)}
            className="h-4 w-4 accent-indigo-600"
          />
          <label htmlFor="useDefaultMap" className="text-sm text-gray-700">
            Use starter map
          </label>
        </div>

        <BasicButton
          disabled={realmName.length <= 0 || loading}
          onClick={createRealm}
          className="w-full text-lg bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {loading ? "Creating..." : "Create"}
        </BasicButton>
      </div>
    </Modal>
  );
};

export default CreateRealmModal;
