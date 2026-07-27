import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const results = await prisma.cognitiveTestResult.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        session: true // Include the linked Session to get Name and ID
      }
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Neurocognitive Testing Battery";
    const worksheet = workbook.addWorksheet("Cognitive Results");

    // Define columns based on the flexible parameters
    worksheet.columns = [
      { header: "ID Number", key: "idNumber", width: 15 },
      { header: "Name", key: "name", width: 20 },
      { header: "Session ID", key: "sessionId", width: 25 },
      { header: "Test Category", key: "category", width: 25 },
      { header: "Specific Test", key: "test", width: 25 },
      { header: "Timestamp", key: "timestamp", width: 25 },
      { header: "Param 1 Name", key: "p1n", width: 25 },
      { header: "Param 1 Value", key: "p1v", width: 15 },
      { header: "Param 2 Name", key: "p2n", width: 25 },
      { header: "Param 2 Value", key: "p2v", width: 15 },
      { header: "Param 3 Name", key: "p3n", width: 25 },
      { header: "Param 3 Value", key: "p3v", width: 15 },
    ];

    // Add rows
    results.forEach((r) => {
      worksheet.addRow({
        idNumber: r.session?.participantIdNumber || "N/A",
        name: r.session?.participantName || "N/A",
        sessionId: r.sessionId,
        category: r.testCategory,
        test: r.specificTest,
        timestamp: r.createdAt.toISOString(),
        p1n: r.param1Name || "",
        p1v: r.param1Value !== null ? r.param1Value : "",
        p2n: r.param2Name || "",
        p2v: r.param2Value !== null ? r.param2Value : "",
        p3n: r.param3Name || "",
        p3v: r.param3Value !== null ? r.param3Value : "",
      });
    });

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFCCCCCC" },
    };

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=cognitive_results.xlsx",
      },
    });

  } catch (error) {
    console.error("Export error:", error);
    return new NextResponse("Failed to export cognitive data", { status: 500 });
  }
}
