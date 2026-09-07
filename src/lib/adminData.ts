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

/**
 * The 12 questionnaire submission tables, which differ only in their score
 * columns. Fetching them via Prisma relation `include`s costs one round trip
 * *each*; this metadata lets us pull all 12 in a single UNION ALL instead.
 */
const SUBMISSION_TABLES = [
  { relation: "cfsSubmission", table: "CFSSubmission", cols: ["score"] },
  { relation: "gaeneSubmission", table: "GAENESubmission", cols: ["score"] },
  { relation: "mateSubmission", table: "MATESubmission", cols: ["score"] },
  { relation: "sbsSubmission", table: "SBSSubmission", cols: ["score"] },
  { relation: "skepSubmission", table: "SKEPSubmission", cols: ["score"] },
  { relation: "tsisSubmission", table: "TSISSubmission", cols: ["scoreSp", "scoreSk", "scoreSa"] },
  { relation: "ncs6Submission", table: "NCS6Submission", cols: ["score"] },
  { relation: "cfqSubmission", table: "CFQSubmission", cols: ["score"] },
  { relation: "dass21Submission", table: "DASS21Submission", cols: ["scoreDepression", "scoreAnxiety", "scoreStress"] },
  { relation: "phq9Submission", table: "PHQ9Submission", cols: ["score"] },
  { relation: "gad7Submission", table: "GAD7Submission", cols: ["score"] },
  { relation: "who5Submission", table: "WHO5Submission", cols: ["score"] },
] as const;

// Table and column names are compile-time constants here — no user input is
// interpolated, so this string is not an injection surface.
const SUBMISSIONS_SQL = SUBMISSION_TABLES.map(({ relation, table, cols }) => {
  const vals = [0, 1, 2]
    .map((i) => (cols[i] ? `"${cols[i]}"::double precision` : `NULL::double precision`))
    .map((expr, i) => `${expr} AS v${i + 1}`)
    .join(", ");
  return `SELECT '${relation}' AS relation, "sessionId", ${vals} FROM "${table}"`;
}).join("\nUNION ALL\n");

type SubmissionRow = {
  relation: string;
  sessionId: string;
  v1: number | null;
  v2: number | null;
  v3: number | null;
};

/** Rebuilds the object shape Prisma's `include` used to produce. */
function toSubmissionObject(row: SubmissionRow) {
  const meta = SUBMISSION_TABLES.find((t) => t.relation === row.relation);
  if (!meta) return null;
  const values = [row.v1, row.v2, row.v3];
  const obj: Record<string, number | null> = {};
  meta.cols.forEach((col, i) => {
    obj[col] = values[i];
  });
  return obj;
}

/**
 * Everything the admin dashboard needs, in a single statement.
 *
 * This matters more than it looks: DATABASE_URL sets `connection_limit=1`
 * (the correct setting for serverless + pgbouncer), which makes Prisma
 * serialize every query onto one connection — `Promise.all` measurably buys
 * nothing. With the database in ap-southeast-1 and users in West Bengal each
 * round trip costs ~305ms, so query *count* is the only lever that matters.
 * `rawTrialData` is excluded: it is the heaviest column and the dashboard
 * never renders it. It is not dropped from the dataset -- the "Raw Trial Data"
 * sheet in /api/admin/export-cognitive-data queries and exports it in full.
 */
const BUNDLE_SQL = `
SELECT
  COALESCE((SELECT json_agg(s ORDER BY s."createdAt" DESC) FROM "Session" s), '[]'::json) AS sessions,
  COALESCE((SELECT json_agg(a ORDER BY a."testName" ASC, a."itemIndex" ASC) FROM "Answer" a), '[]'::json) AS answers,
  COALESCE((SELECT json_agg(c ORDER BY c."createdAt" DESC) FROM (
    SELECT "id", "sessionId", "testCategory", "specificTest",
           "param1Name", "param1Value", "param2Name", "param2Value",
           "param3Name", "param3Value", "createdAt"
    FROM "CognitiveTestResult"
  ) c), '[]'::json) AS cognitive,
  COALESCE((SELECT json_agg(x) FROM (
${SUBMISSIONS_SQL}
  ) x), '[]'::json) AS submissions
`;

type Bundle = {
  sessions: any[];
  answers: any[];
  cognitive: any[];
  submissions: SubmissionRow[];
};

export async function getAdminSpreadsheetData() {
  // Was ~17 sequential round trips (~3.9s on an empty DB): a session.findMany
  // with 14 relation includes, which Prisma splits into one query per
  // relation, plus a second findMany with its own include. Now one.
  const rows = await prisma.$queryRawUnsafe<Bundle[]>(BUNDLE_SQL);
  const bundle: Bundle = rows[0] ?? { sessions: [], answers: [], cognitive: [], submissions: [] };

  // json_agg hands back ISO strings; downstream code calls .toISOString() on
  // these, so rehydrate them into real Dates.
  const sessionRows = (bundle.sessions ?? []).map((s) => ({ ...s, createdAt: new Date(s.createdAt) }));
  const answerRows: any[] = bundle.answers ?? [];
  const cognitiveResultRows = (bundle.cognitive ?? []).map((r) => ({ ...r, createdAt: new Date(r.createdAt) }));
  const submissionRows: SubmissionRow[] = bundle.submissions ?? [];

  const sessionById = new Map(sessionRows.map((s) => [s.id, s]));

  const answersBySession = new Map<string, typeof answerRows>();
  for (const a of answerRows) {
    const list = answersBySession.get(a.sessionId);
    if (list) list.push(a);
    else answersBySession.set(a.sessionId, [a]);
  }

  const cognitiveBySession = new Map<string, typeof cognitiveResultRows>();
  for (const r of cognitiveResultRows) {
    const list = cognitiveBySession.get(r.sessionId);
    if (list) list.push(r);
    else cognitiveBySession.set(r.sessionId, [r]);
  }

  const submissionsBySession = new Map<string, Record<string, any>>();
  for (const row of submissionRows) {
    const obj = toSubmissionObject(row);
    if (!obj) continue;
    const bucket = submissionsBySession.get(row.sessionId) ?? {};
    bucket[row.relation] = obj;
    submissionsBySession.set(row.sessionId, bucket);
  }

  // Reassemble the exact shape the rest of this function expects.
  const sessions = sessionRows.map((s) => ({
    ...s,
    answers: answersBySession.get(s.id) ?? [],
    cognitiveTests: cognitiveBySession.get(s.id) ?? [],
    ...Object.fromEntries(SUBMISSION_TABLES.map((t) => [t.relation, null])),
    ...(submissionsBySession.get(s.id) ?? {}),
  })) as any[];

  const cognitiveResults = cognitiveResultRows.map((r) => ({
    ...r,
    session: sessionById.get(r.sessionId) ?? null,
  }));

  // 3. Construct Cognitive Battery Matrix (Participant Cognitive Metrics)
  const cognitiveGrouped: Record<string, any> = {};
  
  cognitiveResults.forEach((r) => {
    if (!cognitiveGrouped[r.sessionId]) {
      cognitiveGrouped[r.sessionId] = {
        sessionId: r.sessionId,
        idNumber: r.session?.participantIdNumber || r.session?.username || "N/A",
        username: r.session?.username || "-",
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
    idNumber: s.participantIdNumber || s.username || "N/A",
    username: s.username || "-",
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
    s.answers.forEach((ans: (typeof answerRows)[number]) => {
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
          idNumber: s.participantIdNumber || s.username || "N/A",
          username: s.username || "-",
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
    idNumber: s.participantIdNumber || s.username || "N/A",
    username: s.username || "-",
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
    questionnairesAnsweredCount: s.answers.length > 0 ? Array.from(new Set(s.answers.map((a: (typeof answerRows)[number]) => a.testName))).length : 0,
  }));

  // 7. Raw Cognitive Trials Details
  const rawTrials = cognitiveResults.map(r => ({
    id: r.id,
    sessionId: r.sessionId,
    idNumber: r.session?.participantIdNumber || r.session?.username || "N/A",
    username: r.session?.username || "-",
    name: r.session?.participantName || "N/A",
    category: r.testCategory,
    specificTest: r.specificTest,
    param1Name: r.param1Name,
    param1Value: r.param1Value,
    param2Name: r.param2Name,
    param2Value: r.param2Value,
    param3Name: r.param3Name,
    param3Value: r.param3Value,
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
