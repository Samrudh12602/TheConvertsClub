import type { MetadataRoute } from "next";

/** Lets students "Add to Home Screen" and get an app-like icon on their phone. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Converts Club",
    short_name: "Converts Club",
    description: "GDPI prep with mentors who converted last season.",
    start_url: "/student",
    display: "standalone",
    background_color: "#f6f3ee",
    theme_color: "#7a1f2b",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
