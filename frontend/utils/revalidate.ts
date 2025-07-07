"use server";
import { revalidatePath } from "next/cache";

export default async function revalidate(path: string) {
  revalidatePath(path, "page");
}
// This function is used to revalidate a specific path in the Next.js application.
// It uses the `revalidatePath` function from Next.js to trigger a revalidation of the specified path.
// The `path` parameter should be a string representing the path to revalidate.
// This is typically used to ensure that the latest data is fetched and displayed when the page is accessed again.
