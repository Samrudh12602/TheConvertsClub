import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/env";

const PATHS = ["", "/packages", "/services", "/how-it-works", "/mentors", "/results", "/faq", "/become-a-mentor", "/terms", "/privacy", "/refunds"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((p) => ({ url: `${appUrl()}${p}`, changeFrequency: "weekly", priority: p === "" ? 1 : 0.6 }));
}
