import type { Metadata } from "next";

/**
 * The admin portal is intentionally not linked from the participant UI. Keep
 * it out of search indexes too, otherwise "unlisted" lasts only until a
 * crawler finds it.
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
