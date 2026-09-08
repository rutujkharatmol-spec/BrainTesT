import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await verifyAdminSession();
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

    // Group results by sessionId
    const groupedData: Record<string, any> = {};
    
    results.forEach((r) => {
      if (!groupedData[r.sessionId]) {
        groupedData[r.sessionId] = {
          // Username and Aadhaar are distinct columns. Aadhaar is optional, so
          // it must never be back-filled with the username.
          username: r.session?.username || "—",
          idNumber: r.session?.participantIdNumber || "—",
          name: r.session?.participantName || "N/A",
          phoneNo: r.session?.phoneNo || "—",
          age: r.session?.age ?? "—",
          gender: r.session?.gender || "—",
          studentClass: r.session?.studentClass || "—",
          schoolName: r.session?.schoolName || "—",
          createdAt: r.session?.createdAt || r.createdAt
        };
      }
      
      const g = groupedData[r.sessionId];
      
      switch (r.specificTest) {
        case "Stroop Task":
          g.stroopCongruent = r.param1Value;
          g.stroopIncongruent = r.param2Value;
          g.stroopEffect = r.param3Value;
          break;
        case "SART (Basic)":
          g.sartRt = r.param1Value;
          g.sartCommission = r.param2Value;
          g.sartOmission = r.param3Value;
          break;
        case "Dot Probe Task":
          g.dotProbeCongruent = r.param1Value;
          g.dotProbeIncongruent = r.param2Value;
          g.dotProbeBias = r.param3Value;
          break;
        case "2-Back Task":
          g.nbackMeanRT = r.param1Value;
          g.nbackHitRate = r.param2Value;
          g.nbackFalseAlarmRate = r.param3Value;
          break;
        case "Corsi Block Task":
          g.corsiMaxSpan = r.param1Value;
          g.corsiTotalCorrect = r.param2Value;
          break;
        case "Digit Span Task":
          g.digitSpanMax = r.param1Value;
          break;
        case "Lexical Decision Task":
          g.ldtWord = r.param1Value;
          g.ldtNonWord = r.param2Value;
          g.ldtAccuracy = r.param3Value;
          break;
        case "Negative Priming Task":
          g.npControl = r.param1Value;
          g.npPrimed = r.param2Value;
          g.npEffect = r.param3Value;
          break;
        case "Eriksen Flanker Task":
          g.flankerCongruent = r.param1Value;
          g.flankerIncongruent = r.param2Value;
          g.flankerEffect = r.param3Value;
          break;
      }
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Neurocognitive Testing Battery";
    const worksheet = workbook.addWorksheet("Participant Cognitive Metrics");

    // Group headers, row-2 headers and the colour band are all derived from a
    // single definition below. They used to be three hand-maintained lists
    // (hardcoded "A1:B1"/"C1:E1" merge ranges, a separate header array and a
    // parallel colour array), so adding one participant column silently shifted
    // every group banner out of alignment with the data underneath it.
    const GROUPS: {
      name: string;
      band: string;      // row 1 fill
      headerBand: string; // row 2 fill
      cols: { header: string; key: string; width: number }[];
    }[] = [
      {
        name: "",
        band: "FF5B9BD5",
        headerBand: "FF7F7F7F",
        cols: [
          // Aadhaar is optional, so username is the reliable identifier and
          // gets its own column. Previously a missing Aadhaar silently fell
          // back to the username, putting usernames under an "Aadhaar" header.
          { header: "Username", key: "username", width: 18 },
          { header: "Aadhaar Number", key: "idNumber", width: 18 },
          { header: "Name", key: "name", width: 20 },
          { header: "Phone", key: "phoneNo", width: 14 },
          { header: "Age", key: "age", width: 7 },
          { header: "Gender", key: "gender", width: 10 },
          { header: "Class", key: "studentClass", width: 12 },
          { header: "School", key: "schoolName", width: 22 },
        ],
      },
      {
        name: "Stroop Task", band: "FF5B9BD5", headerBand: "FF9BC2E6",
        cols: [
          { header: "Mean RT Congruent", key: "stroopCongruent", width: 20 },
          { header: "Mean RT Incongruent", key: "stroopIncongruent", width: 20 },
          { header: "Stroop Effect (ms)", key: "stroopEffect", width: 20 },
        ],
      },
      {
        name: "SART (Sustained Attention to Response Task)", band: "FF70AD47", headerBand: "FFA9D08E",
        cols: [
          { header: "Mean RT Go Trials", key: "sartRt", width: 20 },
          { header: "Commission Errors", key: "sartCommission", width: 20 },
          { header: "Omission Errors", key: "sartOmission", width: 20 },
        ],
      },
      {
        name: "Dot Probe Task", band: "FFC00000", headerBand: "FFE06666",
        cols: [
          { header: "Mean RT Congruent", key: "dotProbeCongruent", width: 20 },
          { header: "Mean RT Incongruent", key: "dotProbeIncongruent", width: 20 },
          { header: "Attentional Bias Score", key: "dotProbeBias", width: 20 },
        ],
      },
      {
        name: "N-Back Task (2-Back)", band: "FFFFC000", headerBand: "FFFFD966",
        cols: [
          { header: "Mean RT Hits (ms)", key: "nbackMeanRT", width: 20 },
          { header: "Hit Rate (%)", key: "nbackHitRate", width: 15 },
          { header: "False Alarm Rate (%)", key: "nbackFalseAlarmRate", width: 20 },
        ],
      },
      {
        name: "Corsi Block Task", band: "FF7030A0", headerBand: "FFB4A7D6",
        cols: [
          { header: "Max Block Span", key: "corsiMaxSpan", width: 15 },
          { header: "Total Correct", key: "corsiTotalCorrect", width: 15 },
        ],
      },
      {
        name: "Digit Span", band: "FF00B0F0", headerBand: "FF9FC5E8",
        cols: [{ header: "Max Span", key: "digitSpanMax", width: 15 }],
      },
      {
        name: "Lexical Decision Task", band: "FFA5A5A5", headerBand: "FFCCCCCC",
        cols: [
          { header: "Mean RT Word", key: "ldtWord", width: 15 },
          { header: "Mean RT Non-Word", key: "ldtNonWord", width: 20 },
          { header: "Accuracy", key: "ldtAccuracy", width: 15 },
        ],
      },
      {
        name: "Negative Priming", band: "FFD8337B", headerBand: "FFEA9999",
        cols: [
          { header: "Mean RT Control", key: "npControl", width: 20 },
          { header: "Mean RT Primed", key: "npPrimed", width: 20 },
          { header: "Priming Effect (ms)", key: "npEffect", width: 20 },
        ],
      },
      {
        name: "Eriksen Flanker Task", band: "FF548235", headerBand: "FF92D050",
        cols: [
          { header: "Mean RT Congruent", key: "flankerCongruent", width: 20 },
          { header: "Mean RT Incongruent", key: "flankerIncongruent", width: 20 },
          { header: "Flanker Effect (ms)", key: "flankerEffect", width: 20 },
        ],
      },
    ];

    const columns = GROUPS.flatMap(g => g.cols);

    // Columns must be registered before any header/merge work so addRow() can
    // map row objects by key.
    worksheet.columns = columns.map(c => ({ key: c.key, width: c.width }));

    // Row 1: one merged banner per group, spans computed from the group itself.
    let col = 1;
    for (const g of GROUPS) {
      const first = col;
      const last = col + g.cols.length - 1;
      if (last > first) worksheet.mergeCells(1, first, 1, last);
      const cell = worksheet.getCell(1, first);
      cell.value = g.name;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: g.band } };
      col = last + 1;
    }
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).alignment = { horizontal: "center" };

    // Row 2: per-column headers, coloured to match their group.
    col = 1;
    for (const g of GROUPS) {
      for (const c of g.cols) {
        const cell = worksheet.getCell(2, col);
        cell.value = c.header;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: g.headerBand } };
        col++;
      }
    }
    worksheet.getRow(2).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(2).alignment = { horizontal: "center", wrapText: true };
    worksheet.getRow(2).height = 30;

    // Add rows
    const rows = Object.values(groupedData).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    rows.forEach((r: any) => {
      worksheet.addRow(r);
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=participant_cognitive_metrics.xlsx",
      },
    });

  } catch (error) {
    console.error("Export error:", error);
    return new NextResponse("Failed to export cognitive data", { status: 500 });
  }
}
