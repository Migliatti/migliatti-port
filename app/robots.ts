import type { MetadataRoute } from "next";
import { urlDoSite } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", urlDoSite()).href,
  };
}
