/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar/Navbar";
import RealmsMenu from "./RealmsMenu/RealmsMenu";
import { getVisitedRealms } from "@/utils/supabase/getVisitedRealms";
export default async function App() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!user || !session) {
    return redirect("/signin");
  }

  const realms: any = [];
  const visitedRealmsArray: any = [];
  const { data: ownedRealms, error } = await supabase
    .from("realms")
    .select("id, name, share_id")
    .eq("owner_id", user.id);
  if (ownedRealms) {
    realms.push(...ownedRealms);
  }
  if (session) {
    let { data: visitedRealms } = await getVisitedRealms(session.access_token);
    if (visitedRealms) {
      visitedRealms = visitedRealms.map((realm) => ({
        ...realm,
        shared: true,
      }));
      visitedRealmsArray.push(...visitedRealms);
    }
  }
  const errorMessage = error?.message || "";

  return (
    <div>
      <Navbar />
      <h1 className="text-4xl text-center font-bold mt-20 m-4">
        Your <span className="text-blue-600">Spaces</span>
      </h1>
      <RealmsMenu
        visitedRealms={visitedRealmsArray}
        realms={realms}
        errorMessage={errorMessage}
      />
    </div>
  );
}
