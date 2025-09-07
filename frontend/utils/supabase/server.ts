import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async () => {
  // Await cookies if it's a promise
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value ?? null;
        },
        set(name: string, value: string, options: CookieOptions = {}) {
          try {
            cookieStore.set({
              name,
              value,
              path: options.path ?? "/",
              httpOnly: options.httpOnly,
              secure: options.secure,
              sameSite: options.sameSite,
              maxAge: options.maxAge,
            });
          } catch (error) {
            console.log("Cookie set error:", error);
          }
        },
        remove(name: string, options: CookieOptions = {}) {
          try {
            cookieStore.set({
              name,
              value: "",
              path: options.path ?? "/",
              maxAge: 0,
            });
          } catch (error) {
            console.log("Cookie remove error:", error);
          }
        },
      },
    }
  );
};
