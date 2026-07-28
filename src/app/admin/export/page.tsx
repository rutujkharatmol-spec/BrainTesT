import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import ExportButton from "./ExportButton";
import SyncGoogleSheetsButton from "./SyncGoogleSheetsButton";

export default async function AdminExportPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/admin/export");
  }

  return (
    <div className="glass-panel" style={{ maxWidth: 600, margin: "auto", marginTop: "10vh", textAlign: "center" }}>
      <h1>Admin Dashboard</h1>
      <p style={{ marginBottom: 32 }}>Welcome, {session.user?.email}.</p>
      
      <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
        <ExportButton />
        
        <a 
          className="btn" 
          style={{ maxWidth: 300, backgroundColor: "var(--success-color)", textDecoration: "none" }}
          href="/api/admin/export-cognitive-data"
        >
          Download Cognitive Results
        </a>

        <div style={{ width: "100%", borderBottom: "1px solid var(--card-border)", margin: "16px 0" }} />
        
        <SyncGoogleSheetsButton />
      </div>
    </div>
  );
}
