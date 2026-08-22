import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The admin portal is unlisted by design; keep crawlers away from it
      // and from the API surface.
      disallow: ["/admin", "/admin/", "/api/"],
    },
  };
}
