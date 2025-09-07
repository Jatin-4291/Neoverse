/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import "server-only";
import { createClient } from "@supabase/supabase-js";

export async function getVisitedRealms(access_token: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SERVICE_ROLE!
  );

  // Get current user
  const { data: user, error: userError } = await supabase.auth.getUser(
    access_token
  );
  if (!user || !user.user) {
    return { data: null, error: userError };
  }

  // Get user profile (this was missing in your code)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("visited_realms")
    .eq("id", user.user.id)
    .single();

  if (!profile) {
    return { data: null, error: profileError };
  }

  // Fallback to empty array if visited_realms is null
  const realmList = profile.visited_realms ?? [];

  const visitedRealms: any[] = [];
  const realmsToRemove: string[] = [];

  for (const shareId of realmList) {
    const { data } = await supabase
      .from("realms")
      .select("id, name, share_id")
      .eq("share_id", shareId)
      .single();

    if (data) {
      visitedRealms.push(data);
    } else {
      realmsToRemove.push(shareId);
    }
  }

  // Remove any invalid shareIds from profile
  if (realmsToRemove.length > 0) {
    await supabase
      .from("profiles")
      .update({
        visited_realms: realmList.filter(
          (shareId: string) => !realmsToRemove.includes(shareId)
        ),
      })
      .eq("id", user.user.id);
  }

  return { data: visitedRealms, error: null };
}
