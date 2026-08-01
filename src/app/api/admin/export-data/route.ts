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
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Cognitive Self-Assessment App";

    const testNames = ["cfs", "gaene", "mate", "sbs", "skep", "tsis", "ncs6", "cfq", "dass21", "phq9", "gad7", "who5"];

    for (const testName of testNames) {
      const sheet = workbook.addWorksheet(testName.toUpperCase());

      // Fetch normalized answers for this test
      const answers = await prisma.answer.findMany({
        where: { testName },
        include: { session: true },
        orderBy: [{ sessionId: 'asc' }, { itemIndex: 'asc' }]
      });

      if (answers.length === 0) {
        sheet.columns = [{ header: "No Data", key: "nodata", width: 20 }];
        continue;
      }

      // We need to structure it by Session (Row) and Question (Columns)
      // First, find all unique questions for this test to build headers
      const questionIndexes = Array.from(new Set(answers.map(a => a.itemIndex))).sort((a, b) => a - b);
      
      const columns = [
        { header: "Session ID", key: "sessionId", width: 40 },
        { header: "Timestamp", key: "timestamp", width: 25 },
        ...questionIndexes.map(idx => ({ header: `Q${idx}`, key: `q${idx}`, width: 10 }))
      ];

      // specific scores per test
      if (testName === 'tsis') {
        columns.push(
          { header: "Score SP", key: "scoreSp", width: 15 },
          { header: "Score SK", key: "scoreSk", width: 15 },
          { header: "Score SA", key: "scoreSa", width: 15 }
        );
      } else if (testName === 'dass21') {
        columns.push(
          { header: "Score Depression", key: "scoreDepression", width: 15 },
          { header: "Score Anxiety", key: "scoreAnxiety", width: 15 },
          { header: "Score Stress", key: "scoreStress", width: 15 }
        );
      } else {
        columns.push({ header: "Final Score", key: "score", width: 15 });
      }

      sheet.columns = columns;

      // Group answers by session
      const groupedBySession = answers.reduce((acc, curr) => {
        if (!acc[curr.sessionId]) {
          acc[curr.sessionId] = { 
            sessionId: curr.sessionId, 
            timestamp: curr.session.createdAt.toISOString() 
          };
        }
        acc[curr.sessionId][`q${curr.itemIndex}`] = curr.rawScore;
        return acc;
      }, {} as Record<string, any>);

      // Fetch the specific scores from the specific table
      let specificData: any[] = [];
      switch (testName) {
        case "cfs": specificData = await prisma.cFSSubmission.findMany(); break;
        case "gaene": specificData = await prisma.gAENESubmission.findMany(); break;
        case "mate": specificData = await prisma.mATESubmission.findMany(); break;
        case "sbs": specificData = await prisma.sBSSubmission.findMany(); break;
        case "skep": specificData = await prisma.sKEPSubmission.findMany(); break;
        case "tsis": specificData = await prisma.tSISSubmission.findMany(); break;
        case "ncs6": specificData = await prisma.nCS6Submission.findMany(); break;
        case "cfq": specificData = await prisma.cFQSubmission.findMany(); break;
        case "dass21": specificData = await prisma.dASS21Submission.findMany(); break;
        case "phq9": specificData = await prisma.pHQ9Submission.findMany(); break;
        case "gad7": specificData = await prisma.gAD7Submission.findMany(); break;
        case "who5": specificData = await prisma.wHO5Submission.findMany(); break;
      }

      const specificDataMap = new Map(specificData.map(d => [d.sessionId, d]));

      // Populate rows
      for (const [sId, rowData] of Object.entries(groupedBySession)) {
        const submission = specificDataMap.get(sId);
        if (submission) {
          if (testName === 'tsis') {
            rowData.scoreSp = submission.scoreSp;
            rowData.scoreSk = submission.scoreSk;
            rowData.scoreSa = submission.scoreSa;
          } else if (testName === 'dass21') {
            rowData.scoreDepression = submission.scoreDepression;
            rowData.scoreAnxiety = submission.scoreAnxiety;
            rowData.scoreStress = submission.scoreStress;
          } else {
            rowData.score = submission.score;
          }
        }
        sheet.addRow(rowData);
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition": 'attachment; filename="survey_export.xlsx"',
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }
    });

  } catch (error) {
    console.error("Export error:", error);
    return new NextResponse("Failed to export data", { status: 500 });
  }
}
