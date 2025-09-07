import React from "react";
import NotFound from "@/app/not-found";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getPlayRealmData } from "@/utils/supabase/getPlayRealmData";
import PlayClient from "../PlayClient";
import { updateVisitedRealms } from "@/utils/supabase/updateVisitedRealms";
import { formatEmailToName } from "@/utils/formatEmailToName";
interface PlayPageProps {
  params: Promise<{ id: string }>; // <-- Promise type
  searchParams: Promise<{ shareId?: string }>;
}

export default async function Play({ params, searchParams }: PlayPageProps) {
  const { id } = await params; // 👈 await required
  const { shareId } = await searchParams; // 👈 await required

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!session || !user) {
    return redirect("/signin");
  }
  const { data, error } = !shareId
    ? await supabase.from("realms").select("*").eq("id", id).single()
    : await getPlayRealmData(session.access_token, shareId);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("skin")
    .eq("id", user.id)
    .single();

  if (!data || !profile) {
    const message = error?.message || profileError?.message;

    return <NotFound specialMessage={message} />;
  }

  const realm = data;
  const map_data = realm.map_data;

  const skin = profile.skin;

  if (shareId && realm.owner_id !== user.id) {
    await updateVisitedRealms(session.access_token, shareId);
  }

  return (
    <PlayClient
      mapData={map_data}
      username={formatEmailToName(user.user_metadata.email)}
      access_token={session.access_token}
      realmId={id}
      uid={user.id}
      shareId={shareId || ""}
      initialSkin={skin}
      name={realm.name}
    />
  );
}
