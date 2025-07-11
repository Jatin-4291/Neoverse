import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar/Navbar";
import RealmsMenu from "./RealmsMenu/RealmsMenu";
import { getVisitedRealms } from "@/utils/supabase/getVisitedRealms";
export default async function App() {
  const supabase = createClient();

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
  const { data: ownedRealms, error } = await supabase
    .from("realms")
    .select("id, name, share_id")
    .eq("owner_id", user.id);
  console.log("Owned Realms:", ownedRealms, "Error:", error);
  if (ownedRealms) {
    realms.push(...ownedRealms);
  }
  if (session) {
    let { data: visitedRealms, error: visitedRealmsError } =
      await getVisitedRealms(session.access_token);
    if (visitedRealms) {
      visitedRealms = visitedRealms.map((realm) => ({
        ...realm,
        shared: true,
      }));
      realms.push(...visitedRealms);
    }
  }
  const errorMessage = error?.message || "";

  console.log("Realms:", realms);

  return (
    <div>
      <Navbar />
      <h1 className="text-3xl mt-20 ml-4">Your Spaces</h1>
      <RealmsMenu realms={realms} errorMessage={errorMessage} />
    </div>
  );
}
