import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET() {
  const session = await getServerSession(authOptions);
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
          idNumber: r.session?.participantIdNumber || "N/A",
          name: r.session?.participantName || "N/A",
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

    // Add grouped top headers for visual match
    worksheet.mergeCells("A1:B1");
    worksheet.getCell("A1").value = "";
    worksheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5B9BD5" } }; // generic blue
    
    worksheet.mergeCells("C1:E1");
    worksheet.getCell("C1").value = "Stroop Task";
    worksheet.getCell("C1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5B9BD5" } };
    
    worksheet.mergeCells("F1:H1");
    worksheet.getCell("F1").value = "SART (Sustained Attention to Response Task)";
    worksheet.getCell("F1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF70AD47" } };
    
    worksheet.mergeCells("I1:K1");
    worksheet.getCell("I1").value = "Dot Probe Task";
    worksheet.getCell("I1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC00000" } };
    
    worksheet.mergeCells("L1:N1");
    worksheet.getCell("L1").value = "N-Back Task (2-Back)";
    worksheet.getCell("L1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFC000" } };
    
    worksheet.mergeCells("O1:P1");
    worksheet.getCell("O1").value = "Corsi Block Task";
    worksheet.getCell("O1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7030A0" } };
    
    worksheet.mergeCells("Q1:Q1");
    worksheet.getCell("Q1").value = "Digit Span";
    worksheet.getCell("Q1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00B0F0" } };
    
    worksheet.mergeCells("R1:T1");
    worksheet.getCell("R1").value = "Lexical Decision Task";
    worksheet.getCell("R1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFA5A5A5" } };
    
    worksheet.mergeCells("U1:W1");
    worksheet.getCell("U1").value = "Negative Priming";
    worksheet.getCell("U1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD8337B" } };

    worksheet.mergeCells("X1:Z1");
    worksheet.getCell("X1").value = "Eriksen Flanker Task";
    worksheet.getCell("X1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF548235" } };

    // Set font style for super headers
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).alignment = { horizontal: "center" };

    // Define columns (row 2 headers)
    const columns = [
      { header: "IDnumber", key: "idNumber", width: 15 },
      { header: "Name", key: "name", width: 20 },
      // Stroop
      { header: "Mean RT Congruent", key: "stroopCongruent", width: 20 },
      { header: "Mean RT Incongruent", key: "stroopIncongruent", width: 20 },
      { header: "Stroop Effect (ms)", key: "stroopEffect", width: 20 },
      // SART
      { header: "Mean RT Go Trials", key: "sartRt", width: 20 },
      { header: "Commission Errors", key: "sartCommission", width: 20 },
      { header: "Omission Errors", key: "sartOmission", width: 20 },
      // Dot Probe
      { header: "Mean RT Congruent", key: "dotProbeCongruent", width: 20 },
      { header: "Mean RT Incongruent", key: "dotProbeIncongruent", width: 20 },
      { header: "Attentional Bias Score", key: "dotProbeBias", width: 20 },
      // N-Back
      { header: "Mean RT Hits (ms)", key: "nbackMeanRT", width: 20 },
      { header: "Hit Rate (%)", key: "nbackHitRate", width: 15 },
      { header: "False Alarm Rate (%)", key: "nbackFalseAlarmRate", width: 20 },
      // Corsi
      { header: "Max Block Span", key: "corsiMaxSpan", width: 15 },
      { header: "Total Correct", key: "corsiTotalCorrect", width: 15 },
      // Digit Span
      { header: "Max Span", key: "digitSpanMax", width: 15 },
      // LDT
      { header: "Mean RT Word", key: "ldtWord", width: 15 },
      { header: "Mean RT Non-Word", key: "ldtNonWord", width: 20 },
      { header: "Accuracy", key: "ldtAccuracy", width: 15 },
      // Negative Priming
      { header: "Mean RT Control", key: "npControl", width: 20 },
      { header: "Mean RT Primed", key: "npPrimed", width: 20 },
      { header: "Priming Effect (ms)", key: "npEffect", width: 20 },
      // Flanker
      { header: "Mean RT Congruent", key: "flankerCongruent", width: 20 },
      { header: "Mean RT Incongruent", key: "flankerIncongruent", width: 20 },
      { header: "Flanker Effect (ms)", key: "flankerEffect", width: 20 },
    ];

    worksheet.getRow(2).values = columns.map(c => c.header);
    worksheet.columns = columns.map(c => ({ key: c.key, width: c.width }));
    
    // Style the second row headers to match super header colors roughly
    worksheet.getRow(2).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(2).alignment = { horizontal: "center", wrapText: true };
    worksheet.getRow(2).height = 30;

    worksheet.getCell("A2").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7F7F7F" } };
    worksheet.getCell("B2").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7F7F7F" } };
    // We will just style the rest of row 2 with gray background for simplicity, 
    // or iterate through and set background color based on group.
    const colors = [
      "FF7F7F7F", "FF7F7F7F", // A, B
      "FF9BC2E6", "FF9BC2E6", "FF9BC2E6", // Stroop
      "FFA9D08E", "FFA9D08E", "FFA9D08E", // SART
      "FFE06666", "FFE06666", "FFE06666", // Dot Probe
      "FFFFD966", "FFFFD966", "FFFFD966", // N-Back
      "FFB4A7D6", "FFB4A7D6", // Corsi
      "FF9FC5E8", // Digit
      "FFCCCCCC", "FFCCCCCC", "FFCCCCCC", // LDT
      "FFEA9999", "FFEA9999", "FFEA9999", // NP
      "FF92D050", "FF92D050", "FF92D050", // Flanker
    ];
    worksheet.getRow(2).eachCell((cell, colNumber) => {
      const color = colors[colNumber - 1] || "FF888888";
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
    });

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
