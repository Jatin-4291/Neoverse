import React from "react";
import NotFound from "@/app/not-found";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getPlayRealmData } from "@/utils/supabase/getPlayRealmData";
import PlayClient from "../PlayClient";
import { updateVisitedRealms } from "@/utils/supabase/updateVisitedRealms";
import { formatEmailToName } from "@/utils/formatEmailToName";
import { id } from "zod/locales";
export default async function Play(props: {
  params: { id: string };
  searchParams: { shareId?: string };
}) {
  console.log("id", props.params.id, "shareId", props.searchParams.shareId);

  const { params, searchParams } = props;
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log("user", user, "session", session);

  if (!session || !user) {
    return redirect("/signin");
  }

  const { data, error } = !searchParams?.shareId
    ? await supabase
        .from("realms")
        .select("map_data, owner_id, name")
        .eq("id", params.id)
        .single()
    : await getPlayRealmData(session.access_token, searchParams?.shareId);

  console.log(user, "user");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("skin")
    .eq("id", user.id)
    .single();
  // Show not found page if no data is returned
  console.log(profile, "prfile");

  if (!data || !profile) {
    const message = error?.message || profileError?.message;

    return <NotFound specialMessage={message} />;
  }

  const realm = data;
  const map_data = realm.map_data;

  const skin = profile.skin;

  if (searchParams?.shareId && realm.owner_id !== user.id) {
    await updateVisitedRealms(session.access_token, searchParams?.shareId);
  }

  return (
    <PlayClient
      mapData={map_data}
      username={formatEmailToName(user.user_metadata.email)}
      access_token={session.access_token}
      realmId={params.id}
      uid={user.id}
      shareId={searchParams?.shareId || ""}
      initialSkin={skin}
      name={realm.name}
    />
  );
}
