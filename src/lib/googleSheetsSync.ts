import { prisma } from "@/lib/prisma";
import { 
  getDass21DepressionSeverity, 
  getDass21AnxietySeverity, 
  getDass21StressSeverity, 
  getPhq9Severity, 
  getGad7Severity, 
  getWho5Severity 
} from "@/utils/scoring";

export async function syncCognitiveToGoogleSheets() {
  const { APPS_SCRIPT_WEBAPP_URL } = process.env;

  if (!APPS_SCRIPT_WEBAPP_URL) {
    throw new Error("Missing APPS_SCRIPT_WEBAPP_URL in .env");
  }

  // Fetch cognitive data
  const results = await prisma.cognitiveTestResult.findMany({
    orderBy: { createdAt: "asc" }, // Append oldest first
    include: {
      session: true
    }
  });

  const groupedData: Record<string, any> = {};
  
  results.forEach((r) => {
    if (!groupedData[r.sessionId]) {
      groupedData[r.sessionId] = {
        sessionId: r.sessionId,
        idNumber: r.session?.participantIdNumber || "N/A",
        name: r.session?.participantName || "N/A",
        age: r.session?.age ?? "",
        gender: r.session?.gender || "N/A",
        studentClass: r.session?.studentClass || "N/A",
        schoolName: r.session?.schoolName || "N/A",
        address: r.session?.address || "N/A",
        phoneNo: r.session?.phoneNo || "N/A",
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

  // Formatting rows for Google Sheets to match the Excel format exactly
  const rows = Object.values(groupedData).map((g: any) => [
    g.idNumber,
    g.name,
    g.age,
    g.gender,
    g.studentClass,
    g.schoolName,
    g.address,
    g.phoneNo,
    g.stroopCongruent ?? "",
    g.stroopIncongruent ?? "",
    g.stroopEffect ?? "",
    g.sartRt ?? "",
    g.sartCommission ?? "",
    g.sartOmission ?? "",
    g.dotProbeCongruent ?? "",
    g.dotProbeIncongruent ?? "",
    g.dotProbeBias ?? "",
    g.nbackMeanRT ?? "",
    g.nbackHitRate ?? "",
    g.nbackFalseAlarmRate ?? "",
    g.corsiMaxSpan ?? "",
    g.corsiTotalCorrect ?? "",
    g.digitSpanMax ?? "",
    g.ldtWord ?? "",
    g.ldtNonWord ?? "",
    g.ldtAccuracy ?? "",
    g.npControl ?? "",
    g.npPrimed ?? "",
    g.npEffect ?? "",
    g.flankerCongruent ?? "",
    g.flankerIncongruent ?? "",
    g.flankerEffect ?? "",
    g.sessionId, // Keep sessionId for deduplication
    new Date(g.createdAt).toISOString()
  ]);

  // Send payload to Apps Script
  const response = await fetch(APPS_SCRIPT_WEBAPP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: JSON.stringify({ sheetName: "Sheet1", rows }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Apps Script responded with ${response.status}: ${text}`);
  }

  return await response.json().catch(() => ({}));
}

export async function syncQuestionnairesToGoogleSheets() {
  const { APPS_SCRIPT_WEBAPP_URL } = process.env;

  if (!APPS_SCRIPT_WEBAPP_URL) {
    throw new Error("Missing APPS_SCRIPT_WEBAPP_URL in .env");
  }

  // Fetch questionnaire data
  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      cfsSubmission: true,
      gaeneSubmission: true,
      mateSubmission: true,
      sbsSubmission: true,
      skepSubmission: true,
      tsisSubmission: true,
      ncs6Submission: true,
      cfqSubmission: true,
      dass21Submission: true,
      phq9Submission: true,
      gad7Submission: true,
      who5Submission: true,
    }
  });

  const rows = sessions.map(session => [
    session.participantIdNumber || "N/A",
    session.participantName || "N/A",
    session.age ?? "",
    session.gender || "N/A",
    session.studentClass || "N/A",
    session.schoolName || "N/A",
    session.address || "N/A",
    session.phoneNo || "N/A",
    
    // Questionnaire scores
    session.cfsSubmission?.score ?? "",
    session.gaeneSubmission?.score ?? "",
    session.mateSubmission?.score ?? "",
    session.sbsSubmission?.score ?? "",
    session.skepSubmission?.score ?? "",
    
    session.tsisSubmission?.scoreSp ?? "",
    session.tsisSubmission?.scoreSk ?? "",
    session.tsisSubmission?.scoreSa ?? "",
    
    session.ncs6Submission?.score ?? "",
    session.cfqSubmission?.score ?? "",
    
    session.dass21Submission?.scoreDepression ?? "",
    getDass21DepressionSeverity(session.dass21Submission?.scoreDepression as number),
    session.dass21Submission?.scoreAnxiety ?? "",
    getDass21AnxietySeverity(session.dass21Submission?.scoreAnxiety as number),
    session.dass21Submission?.scoreStress ?? "",
    getDass21StressSeverity(session.dass21Submission?.scoreStress as number),
    
    session.phq9Submission?.score ?? "",
    getPhq9Severity(session.phq9Submission?.score as number),
    session.gad7Submission?.score ?? "",
    getGad7Severity(session.gad7Submission?.score as number),
    session.who5Submission?.score ?? "",
    getWho5Severity(session.who5Submission?.score as number),

    session.id, // sessionId
    new Date(session.createdAt).toISOString()
  ]);

  // Send payload to Apps Script
  const response = await fetch(APPS_SCRIPT_WEBAPP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: JSON.stringify({ sheetName: "Sheet2", rows }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Apps Script responded with ${response.status}: ${text}`);
  }

  return await response.json().catch(() => ({}));
}
