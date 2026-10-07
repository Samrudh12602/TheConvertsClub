import { redirect } from "next/navigation";

/** The free checklist is no longer offered. Old links go to the home page. */
export default function FreeGuidePage() {
  redirect("/");
}
