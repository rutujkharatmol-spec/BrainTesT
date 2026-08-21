import { prisma } from "@/lib/prisma";
import { 
  getDass21DepressionSeverity, 
  getDass21AnxietySeverity, 
  getDass21StressSeverity, 
  getPhq9Severity, 
  getGad7Severity, 
  getWho5Severity 
} from "@/utils/scoring";
import { QUESTIONNAIRES } from "@/config/questionnaires";

export async function getAdminSpreadsheetData() {
  // 1. Fetch all sessions with all relations
  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      cognitiveTests: {
        orderBy: { createdAt: "desc" }
      },
      answers: {
        orderBy: [{ testName: "asc" }, { itemIndex: "asc" }]
      },
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

  // 2. Fetch all cognitive test results
  const cognitiveResults = await prisma.cognitiveTestResult.findMany({
    orderBy: { createdAt: "desc" },
    include: { session: true }
  });

  // 3. Construct Cognitive Battery Matrix (Participant Cognitive Metrics)
  const cognitiveGrouped: Record<string, any> = {};
  
  cognitiveResults.forEach((r) => {
    if (!cognitiveGrouped[r.sessionId]) {
      cognitiveGrouped[r.sessionId] = {
        sessionId: r.sessionId,
        idNumber: r.session?.participantIdNumber || "N/A",
        name: r.session?.participantName || "N/A",
        age: r.session?.age ?? "-",
        gender: r.session?.gender || "-",
        studentClass: r.session?.studentClass || "-",
        schoolName: r.session?.schoolName || "-",
        phoneNo: r.session?.phoneNo || "-",
        createdAt: r.session?.createdAt ? new Date(r.session.createdAt).toISOString() : new Date(r.createdAt).toISOString(),
        // Stroop
        stroopCongruent: null,
        stroopIncongruent: null,
        stroopEffect: null,
        // SART
        sartRt: null,
        sartCommission: null,
        sartOmission: null,
        // Dot Probe
        dotProbeCongruent: null,
        dotProbeIncongruent: null,
        dotProbeBias: null,
        // 2-Back
        nbackMeanRT: null,
        nbackHitRate: null,
        nbackFalseAlarmRate: null,
        // Corsi
        corsiMaxSpan: null,
        corsiTotalCorrect: null,
        // Digit Span
        digitSpanMax: null,
        // LDT
        ldtWord: null,
        ldtNonWord: null,
        ldtAccuracy: null,
        // Negative Priming
        npControl: null,
        npPrimed: null,
        npEffect: null,
        // Flanker
        flankerCongruent: null,
        flankerIncongruent: null,
        flankerEffect: null,
      };
    }

    const g = cognitiveGrouped[r.sessionId];

    switch (r.specificTest) {
      case "Stroop Task":
        g.stroopCongruent = r.param1Value;
        g.stroopIncongruent = r.param2Value;
        g.stroopEffect = r.param3Value;
        break;
      case "SART (Basic)":
      case "SART":
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

  const cognitiveRows = Object.values(cognitiveGrouped).sort(
    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // 4. Construct Questionnaires Overview
  const questionnairesOverview = sessions.map((s) => ({
    sessionId: s.id,
    idNumber: s.participantIdNumber || "N/A",
    name: s.participantName || "N/A",
    age: s.age ?? "-",
    gender: s.gender || "-",
    studentClass: s.studentClass || "-",
    schoolName: s.schoolName || "-",
    createdAt: s.createdAt.toISOString(),
    cfsScore: s.cfsSubmission?.score ?? null,
    gaeneScore: s.gaeneSubmission?.score ?? null,
    mateScore: s.mateSubmission?.score ?? null,
    sbsScore: s.sbsSubmission?.score ?? null,
    skepScore: s.skepSubmission?.score ?? null,
    tsisSp: s.tsisSubmission?.scoreSp ?? null,
    tsisSk: s.tsisSubmission?.scoreSk ?? null,
    tsisSa: s.tsisSubmission?.scoreSa ?? null,
    ncs6Score: s.ncs6Submission?.score ?? null,
    cfqScore: s.cfqSubmission?.score ?? null,
    dass21Depression: s.dass21Submission?.scoreDepression ?? null,
    dass21DepressionSeverity: s.dass21Submission ? getDass21DepressionSeverity(s.dass21Submission.scoreDepression) : null,
    dass21Anxiety: s.dass21Submission?.scoreAnxiety ?? null,
    dass21AnxietySeverity: s.dass21Submission ? getDass21AnxietySeverity(s.dass21Submission.scoreAnxiety) : null,
    dass21Stress: s.dass21Submission?.scoreStress ?? null,
    dass21StressSeverity: s.dass21Submission ? getDass21StressSeverity(s.dass21Submission.scoreStress) : null,
    phq9Score: s.phq9Submission?.score ?? null,
    phq9Severity: s.phq9Submission ? getPhq9Severity(s.phq9Submission.score) : null,
    gad7Score: s.gad7Submission?.score ?? null,
    gad7Severity: s.gad7Submission ? getGad7Severity(s.gad7Submission.score) : null,
    who5Score: s.who5Submission?.score ?? null,
    who5Severity: s.who5Submission ? getWho5Severity(s.who5Submission.score) : null,
  }));

  // 5. Construct Individual Questionnaire Sheets
  const testNames = ["cfs", "gaene", "mate", "sbs", "skep", "tsis", "ncs6", "cfq", "dass21", "phq9", "gad7", "who5"];
  
  const answersByTest: Record<string, Record<string, Record<string, number>>> = {};
  testNames.forEach(t => { answersByTest[t] = {}; });

  sessions.forEach(s => {
    s.answers.forEach(ans => {
      const t = ans.testName.toLowerCase();
      if (answersByTest[t]) {
        if (!answersByTest[t][ans.sessionId]) {
          answersByTest[t][ans.sessionId] = {};
        }
        answersByTest[t][ans.sessionId][`q${ans.itemIndex}`] = ans.rawScore;
      }
    });
  });

  const individualSheets: Record<string, any[]> = {};

  testNames.forEach(t => {
    const qDef = QUESTIONNAIRES.find(q => q.id === t);
    const questionCount = qDef?.items.length || 0;

    const rows = sessions
      .filter(s => {
        const hasAnswers = answersByTest[t][s.id] && Object.keys(answersByTest[t][s.id]).length > 0;
        const hasSubmission = (s as any)[`${t}Submission`];
        return hasAnswers || hasSubmission;
      })
      .map(s => {
        const row: Record<string, any> = {
          sessionId: s.id,
          idNumber: s.participantIdNumber || "N/A",
          name: s.participantName || "N/A",
          age: s.age ?? "-",
          gender: s.gender || "-",
          studentClass: s.studentClass || "-",
          schoolName: s.schoolName || "-",
          createdAt: s.createdAt.toISOString(),
        };

        // Fill questions Q1 to QN
        const sessionAnswers = answersByTest[t][s.id] || {};
        for (let i = 1; i <= questionCount; i++) {
          row[`q${i}`] = sessionAnswers[`q${i}`] !== undefined ? sessionAnswers[`q${i}`] : null;
        }

        // Specific scoring fields
        if (t === "tsis") {
          row.scoreSp = s.tsisSubmission?.scoreSp ?? null;
          row.scoreSk = s.tsisSubmission?.scoreSk ?? null;
          row.scoreSa = s.tsisSubmission?.scoreSa ?? null;
        } else if (t === "dass21") {
          row.scoreDepression = s.dass21Submission?.scoreDepression ?? null;
          row.severityDepression = s.dass21Submission ? getDass21DepressionSeverity(s.dass21Submission.scoreDepression) : null;
          row.scoreAnxiety = s.dass21Submission?.scoreAnxiety ?? null;
          row.severityAnxiety = s.dass21Submission ? getDass21AnxietySeverity(s.dass21Submission.scoreAnxiety) : null;
          row.scoreStress = s.dass21Submission?.scoreStress ?? null;
          row.severityStress = s.dass21Submission ? getDass21StressSeverity(s.dass21Submission.scoreStress) : null;
        } else if (t === "phq9") {
          row.score = s.phq9Submission?.score ?? null;
          row.severity = s.phq9Submission ? getPhq9Severity(s.phq9Submission.score) : null;
        } else if (t === "gad7") {
          row.score = s.gad7Submission?.score ?? null;
          row.severity = s.gad7Submission ? getGad7Severity(s.gad7Submission.score) : null;
        } else if (t === "who5") {
          row.score = s.who5Submission?.score ?? null;
          row.severity = s.who5Submission ? getWho5Severity(s.who5Submission.score) : null;
        } else {
          const sub = (s as any)[`${t}Submission`];
          row.score = sub?.score ?? null;
        }

        return row;
      });

    individualSheets[t] = rows;
  });

  // 6. Participants Master Sheet
  const participants = sessions.map(s => ({
    sessionId: s.id,
    idNumber: s.participantIdNumber || "N/A",
    name: s.participantName || "N/A",
    age: s.age ?? "-",
    gender: s.gender || "-",
    studentClass: s.studentClass || "-",
    schoolName: s.schoolName || "-",
    phoneNo: s.phoneNo || "-",
    address: s.address || "-",
    createdAt: s.createdAt.toISOString(),
    consentGiven: s.consentGiven ? "Yes" : "No",
    completed: s.completed ? "Completed" : "Incomplete",
    cognitiveTestsCount: s.cognitiveTests.length,
    questionnairesAnsweredCount: s.answers.length > 0 ? Array.from(new Set(s.answers.map(a => a.testName))).length : 0,
  }));

  // 7. Raw Cognitive Trials Details
  const rawTrials = cognitiveResults.map(r => ({
    id: r.id,
    sessionId: r.sessionId,
    idNumber: r.session?.participantIdNumber || "N/A",
    name: r.session?.participantName || "N/A",
    category: r.testCategory,
    specificTest: r.specificTest,
    param1Name: r.param1Name,
    param1Value: r.param1Value,
    param2Name: r.param2Name,
    param2Value: r.param2Value,
    param3Name: r.param3Name,
    param3Value: r.param3Value,
    rawTrialData: r.rawTrialData,
    createdAt: r.createdAt.toISOString(),
  }));

  // 8. Overview Stats
  const stats = {
    totalParticipants: sessions.length,
    completedSessions: sessions.filter(s => s.completed).length,
    totalCognitiveTests: cognitiveResults.length,
    totalQuestionnaireAnswers: sessions.reduce((acc, curr) => acc + curr.answers.length, 0),
    lastUpdated: new Date().toISOString(),
  };

  return {
    stats,
    cognitiveRows,
    questionnairesOverview,
    individualSheets,
    participants,
    rawTrials,
  };
}
