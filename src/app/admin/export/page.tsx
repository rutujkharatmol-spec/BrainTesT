import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAdminSpreadsheetData } from "@/lib/adminData";
import AdminSpreadsheetViewer from "@/components/admin/AdminSpreadsheetViewer";

export const dynamic = "force-dynamic";

export default async function AdminExportPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/admin/export");
  }

  const initialData = await getAdminSpreadsheetData();

  return (
    <div style={{ width: "100%", maxWidth: "100%", margin: "0 auto" }}>
      <AdminSpreadsheetViewer initialData={initialData} />
    </div>
  );
}
