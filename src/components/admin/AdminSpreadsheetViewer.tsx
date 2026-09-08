"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";

export type SessionData = {
  sessionId: string;
  idNumber: string;
  name: string;
  age: number | string;
  gender: string;
  studentClass: string;
  schoolName: string;
  phoneNo?: string;
  address?: string;
  createdAt: string;
  consentGiven?: string;
  completed?: string;
  cognitiveTestsCount?: number;
  questionnairesAnsweredCount?: number;
  [key: string]: any;
};

export type AdminDataPayload = {
  stats: {
    totalParticipants: number;
    completedSessions: number;
    totalCognitiveTests: number;
    totalQuestionnaireAnswers: number;
    lastUpdated: string;
  };
  cognitiveRows: SessionData[];
  questionnairesOverview: SessionData[];
  individualSheets: Record<string, SessionData[]>;
  participants: SessionData[];
  rawTrials: any[];
};

const TASK_GROUP_META: Record<string, { label: string; icon: string; bgGradient: string; headerBg: string; borderColor: string; pillColor: string }> = {
  "Participant": {
    label: "Participant Profile",
    icon: "👤",
    bgGradient: "linear-gradient(135deg, #0f172a, #1e293b)",
    headerBg: "#f8fafc",
    borderColor: "#cbd5e1",
    pillColor: "#334155"
  },
  "Stroop Task": {
    label: "Stroop Task",
    icon: "🎯",
    bgGradient: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    headerBg: "#eff6ff",
    borderColor: "#bfdbfe",
    pillColor: "#2563eb"
  },
  "SART": {
    label: "SART (Attention)",
    icon: "⏱️",
    bgGradient: "linear-gradient(135deg, #047857, #059669)",
    headerBg: "#ecfdf5",
    borderColor: "#a7f3d0",
    pillColor: "#059669"
  },
  "Dot Probe": {
    label: "Dot Probe Task",
    icon: "🔴",
    bgGradient: "linear-gradient(135deg, #b91c1c, #dc2626)",
    headerBg: "#fef2f2",
    borderColor: "#fecaca",
    pillColor: "#dc2626"
  },
  "2-Back Task": {
    label: "N-Back (2-Back)",
    icon: "🧠",
    bgGradient: "linear-gradient(135deg, #b45309, #d97706)",
    headerBg: "#fffbeb",
    borderColor: "#fde68a",
    pillColor: "#d97706"
  },
  "Corsi Block": {
    label: "Corsi Block Task",
    icon: "🧱",
    bgGradient: "linear-gradient(135deg, #6d28d9, #7c3aed)",
    headerBg: "#f5f3ff",
    borderColor: "#ddd6fe",
    pillColor: "#7c3aed"
  },
  "Digit Span": {
    label: "Digit Span Task",
    icon: "🔢",
    bgGradient: "linear-gradient(135deg, #0e7490, #0891b2)",
    headerBg: "#ecfeff",
    borderColor: "#a5f3fc",
    pillColor: "#0891b2"
  },
  "Lexical Decision": {
    label: "Lexical Decision (LDT)",
    icon: "📖",
    bgGradient: "linear-gradient(135deg, #334155, #475569)",
    headerBg: "#f1f5f9",
    borderColor: "#e2e8f0",
    pillColor: "#475569"
  },
  "Negative Priming": {
    label: "Negative Priming",
    icon: "⚡",
    bgGradient: "linear-gradient(135deg, #be185d, #db2777)",
    headerBg: "#fdf2f8",
    borderColor: "#fbcfe8",
    pillColor: "#db2777"
  },
  "Flanker Task": {
    label: "Eriksen Flanker",
    icon: "🏹",
    bgGradient: "linear-gradient(135deg, #4d7c0f, #65a30d)",
    headerBg: "#f7fee7",
    borderColor: "#d9f99d",
    pillColor: "#65a30d"
  }
};

const QUESTIONNAIRE_CONFIGS: Record<string, { title: string; count: number; description: string; badge: string; color: string }> = {
  cfs: { title: "Cognitive Flexibility Scale (CFS)", count: 25, description: "Self-perceived cognitive and behavioral flexibility", badge: "25 Items", color: "#2563eb" },
  gaene: { title: "Generalized Academic Engagement (GAENE)", count: 8, description: "Academic motivation & engagement", badge: "8 Items", color: "#059669" },
  mate: { title: "Acceptance of Evolution (MATE)", count: 20, description: "Evolutionary science acceptance index", badge: "20 Items", color: "#7c3aed" },
  sbs: { title: "Somatic Symptoms Scale (SBS)", count: 15, description: "Physical & somatic symptom inventory", badge: "15 Items", color: "#d97706" },
  skep: { title: "Skepticism & Epistemic Views (SKEP)", count: 10, description: "Scientific epistemic skepticism assessment", badge: "10 Items", color: "#0891b2" },
  tsis: { title: "Texas Social Intelligence Scale (TSIS)", count: 21, description: "Social Information Processing, Social Skills, Social Awareness", badge: "21 Items", color: "#4f46e5" },
  ncs6: { title: "Need for Cognition 6 (NCS-6)", count: 6, description: "Intellectual curiosity & cognitive exertion", badge: "6 Items", color: "#0284c7" },
  cfq: { title: "Cognitive Failures Questionnaire (CFQ)", count: 12, description: "Self-reported daily perceptual/motor slips", badge: "12 Items", color: "#64748b" },
  dass21: { title: "DASS-21 (Depression, Anxiety, Stress)", count: 21, description: "Tri-axial emotional disturbance scale", badge: "21 Items", color: "#dc2626" },
  phq9: { title: "PHQ-9 (Patient Health Questionnaire)", count: 9, description: "Clinical depression severity screening", badge: "9 Items", color: "#e11d48" },
  gad7: { title: "GAD-7 (Generalized Anxiety Disorder)", count: 7, description: "Clinical generalized anxiety scale", badge: "7 Items", color: "#ea580c" },
  who5: { title: "WHO-5 (Well-Being Index)", count: 5, description: "Positive psychological well-being index", badge: "5 Items", color: "#16a34a" },
};

// Height of the cognitive "group" super-header row; the column header row is
// pinned directly underneath it, so both must agree on this number.
const GROUP_HEADER_H = 29;

export default function AdminSpreadsheetViewer({ initialData }: { initialData: AdminDataPayload }) {
  const [data, setData] = useState<AdminDataPayload>(initialData);
  const [activeTab, setActiveTab] = useState<"cognitive" | "questionnaires" | "participants" | "raw">("cognitive");
  const [activeQuestionnaire, setActiveQuestionnaire] = useState<string>("overview");
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPreset, setFilterPreset] = useState<"all" | "completed" | "severe">("all");
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortKey, setSortKey] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // UI View Controls
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showStatsBar, setShowStatsBar] = useState(false);

  // Table ref for smooth scrolling to task groups
  const tableWrapperRef = useRef<HTMLDivElement>(null);

  // Selected participant for dossier modal
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [dossierTab, setDossierTab] = useState<"clinical" | "cognitive" | "raw">("clinical");
  const [rawTrialSearch, setRawTrialSearch] = useState("");

  // Sync / Action statuses
  const [syncStatus, setSyncStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [syncMessage, setSyncMessage] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Participant deletion state
  const [deletingParticipant, setDeletingParticipant] = useState<{
    sessionId: string;
    name: string;
    idNumber?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionNotification, setActionNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Viewport tracking drives the responsive layout below (phone / tablet / desktop)
  const [vw, setVw] = useState<number>(1280);
  useEffect(() => {
    const compute = () => setVw(window.innerWidth);
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("orientationchange", compute);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("orientationchange", compute);
    };
  }, []);
  const isMobile = vw <= 640;

  // On phones the secondary toolbar collapses behind a single "Tools" toggle
  const [showMobileTools, setShowMobileTools] = useState(false);

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm("");
  }, [activeTab, activeQuestionnaire]);

  // Refresh data handler
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch("/api/admin/sheet-data");
      if (res.ok) {
        const freshData = await res.json();
        setData(freshData);
      }
    } catch (e) {
      console.error("Refresh failed:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Delete participant handler
  const handleDeleteParticipant = async () => {
    if (!deletingParticipant) return;
    const targetId = deletingParticipant.sessionId;
    const targetName = deletingParticipant.name || deletingParticipant.idNumber || "Participant";

    try {
      setIsDeleting(true);
      const res = await fetch("/api/admin/delete-participant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: targetId }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to delete" }));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      // Update state locally
      setData((prev) => {
        const targetSession = prev.participants.find((p) => p.sessionId === targetId);
        const wasCompleted = targetSession?.completed === "Completed";
        const cognitiveCount = targetSession?.cognitiveTestsCount || 0;
        const questionnaireAnswersCount = targetSession?.questionnairesAnsweredCount || 0;

        return {
          ...prev,
          stats: {
            ...prev.stats,
            totalParticipants: Math.max(0, prev.stats.totalParticipants - 1),
            completedSessions: wasCompleted ? Math.max(0, prev.stats.completedSessions - 1) : prev.stats.completedSessions,
            totalCognitiveTests: Math.max(0, prev.stats.totalCognitiveTests - cognitiveCount),
            totalQuestionnaireAnswers: Math.max(0, prev.stats.totalQuestionnaireAnswers - questionnaireAnswersCount),
          },
          participants: prev.participants.filter((p) => p.sessionId !== targetId),
          cognitiveRows: prev.cognitiveRows.filter((r) => r.sessionId !== targetId),
          questionnairesOverview: prev.questionnairesOverview.filter((q) => q.sessionId !== targetId),
          rawTrials: prev.rawTrials.filter((t) => t.sessionId !== targetId),
          individualSheets: Object.fromEntries(
            Object.entries(prev.individualSheets).map(([k, v]) => [k, v.filter((r) => r.sessionId !== targetId)])
          ),
        };
      });

      // If dossier modal is open for this participant, close it
      if (selectedParticipantId === targetId) {
        setSelectedParticipantId(null);
      }

      setDeletingParticipant(null);
      setActionNotification({
        type: "success",
        message: `Successfully deleted participant "${targetName}".`,
      });
      setTimeout(() => setActionNotification(null), 5000);
    } catch (err: any) {
      setActionNotification({
        type: "error",
        message: `Delete failed: ${err.message || "Unknown error"}`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Google Sheets Sync
  const handleSyncGoogleSheets = async () => {
    try {
      setSyncStatus("loading");
      setSyncMessage("Syncing data to Google Sheets Webhook...");
      const res = await fetch("/api/admin/sync-google-sheet", { method: "POST" });
      if (res.ok) {
        setSyncStatus("success");
        setSyncMessage("Synced all sheets to Google Sheets!");
        setTimeout(() => setSyncStatus("idle"), 4000);
      } else {
        const err = await res.text();
        setSyncStatus("error");
        setSyncMessage("Failed to sync: " + err);
      }
    } catch (e: any) {
      setSyncStatus("error");
      setSyncMessage("Sync Error: " + (e?.message || "Network error"));
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/admin/logout", { method: "POST" });
    } catch {
      // ignore
    }
    window.location.href = "/admin/login";
  };

  // Smooth scroll directly to a task column group in the spreadsheet
  const scrollToGroup = (groupName: string) => {
    if (!tableWrapperRef.current) return;
    if (groupName === "Participant") {
      tableWrapperRef.current.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    const targetId = `group-header-${groupName.replace(/\s+/g, '-').toLowerCase()}`;
    const el = document.getElementById(targetId);
    if (el) {
      // Offset by whichever participant columns are pinned at this breakpoint
      const stickyColumnsWidth = isMobile ? 88 : 270;
      const targetScrollLeft = el.offsetLeft - stickyColumnsWidth - 6;
      tableWrapperRef.current.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: "smooth"
      });
    }
  };

  // Determine active rows & columns based on active tab
  const { currentRows, columns, sheetTitle, badgeText, badgeColor } = useMemo(() => {
    if (activeTab === "cognitive") {
      return {
        currentRows: data.cognitiveRows,
        sheetTitle: "Cognitive Battery Matrix",
        badgeText: "9 Tasks",
        badgeColor: "#1e40af",
        columns: [
          { key: "idNumber", label: "Aadhaar / ID", group: "Participant", width: 145, sticky: true, isId: true },
          { key: "username", group: "Participant", label: "Username", width: 135, sticky: true },
          { key: "name", label: "Participant Name", group: "Participant", width: 175, sticky: true, isName: true },
          { key: "schoolName", label: "School / Institution", group: "Participant", width: 160 },
          { key: "createdAt", label: "Date", group: "Participant", width: 120, isDate: true, isLastInGroup: true },
          // Stroop
          { key: "stroopCongruent", label: "RT Cong (ms)", group: "Stroop Task", color: "#2563eb", width: 120, isNumeric: true },
          { key: "stroopIncongruent", label: "RT Incong (ms)", group: "Stroop Task", color: "#2563eb", width: 125, isNumeric: true },
          { key: "stroopEffect", label: "Stroop Effect", group: "Stroop Task", color: "#2563eb", width: 125, isNumeric: true, bold: true, isHighlightPill: true, isLastInGroup: true },
          // SART
          { key: "sartRt", label: "RT Go (ms)", group: "SART", color: "#059669", width: 115, isNumeric: true },
          { key: "sartCommission", label: "Comm Errors", group: "SART", color: "#059669", width: 115, isNumeric: true },
          { key: "sartOmission", label: "Omiss Errors", group: "SART", color: "#059669", width: 115, isNumeric: true, isLastInGroup: true },
          // Dot Probe
          { key: "dotProbeCongruent", label: "RT Cong (ms)", group: "Dot Probe", color: "#dc2626", width: 120, isNumeric: true },
          { key: "dotProbeIncongruent", label: "RT Incong (ms)", group: "Dot Probe", color: "#dc2626", width: 125, isNumeric: true },
          { key: "dotProbeBias", label: "Bias Score", group: "Dot Probe", color: "#dc2626", width: 115, isNumeric: true, bold: true, isHighlightPill: true, isLastInGroup: true },
          // 2-Back
          { key: "nbackMeanRT", label: "RT Hits (ms)", group: "2-Back Task", color: "#d97706", width: 115, isNumeric: true },
          { key: "nbackHitRate", label: "Hit Rate %", group: "2-Back Task", color: "#d97706", width: 110, isNumeric: true, isPercent: true },
          { key: "nbackFalseAlarmRate", label: "FA Rate %", group: "2-Back Task", color: "#d97706", width: 110, isNumeric: true, isPercent: true, isLastInGroup: true },
          // Corsi
          { key: "corsiMaxSpan", label: "Max Block Span", group: "Corsi Block", color: "#7c3aed", width: 125, isNumeric: true, bold: true, isHighlightPill: true },
          { key: "corsiTotalCorrect", label: "Total Correct", group: "Corsi Block", color: "#7c3aed", width: 115, isNumeric: true, isLastInGroup: true },
          // Digit Span
          { key: "digitSpanMax", label: "Max Digit Span", group: "Digit Span", color: "#0891b2", width: 125, isNumeric: true, bold: true, isHighlightPill: true, isLastInGroup: true },
          // LDT
          { key: "ldtWord", label: "RT Word (ms)", group: "Lexical Decision", color: "#475569", width: 120, isNumeric: true },
          { key: "ldtNonWord", label: "RT Non-Word", group: "Lexical Decision", color: "#475569", width: 120, isNumeric: true },
          { key: "ldtAccuracy", label: "Accuracy %", group: "Lexical Decision", color: "#475569", width: 110, isNumeric: true, isPercent: true, isLastInGroup: true },
          // Negative Priming
          { key: "npControl", label: "RT Ctrl (ms)", group: "Negative Priming", color: "#db2777", width: 115, isNumeric: true },
          { key: "npPrimed", label: "RT Primed", group: "Negative Priming", color: "#db2777", width: 115, isNumeric: true },
          { key: "npEffect", label: "Priming Effect", group: "Negative Priming", color: "#db2777", width: 125, isNumeric: true, bold: true, isHighlightPill: true, isLastInGroup: true },
          // Flanker
          { key: "flankerCongruent", label: "RT Cong (ms)", group: "Flanker Task", color: "#65a30d", width: 120, isNumeric: true },
          { key: "flankerIncongruent", label: "RT Incong", group: "Flanker Task", color: "#65a30d", width: 120, isNumeric: true },
          { key: "flankerEffect", label: "Flanker Effect", group: "Flanker Task", color: "#65a30d", width: 120, isNumeric: true, bold: true, isHighlightPill: true, isLastInGroup: true },
        ]
      };
    } else if (activeTab === "questionnaires") {
      if (activeQuestionnaire === "overview") {
        return {
          currentRows: data.questionnairesOverview,
          sheetTitle: "Questionnaires Master Overview",
          badgeText: "12 Scales Overview",
          badgeColor: "#1e40af",
          columns: [
            { key: "idNumber", label: "Aadhaar / ID", width: 145, sticky: true, isId: true },
            { key: "username", label: "Username", width: 135, sticky: true },
            { key: "name", label: "Participant Name", width: 175, sticky: true, isName: true },
            { key: "schoolName", label: "School", width: 150 },
            { key: "createdAt", label: "Date", width: 120, isDate: true, isLastInGroup: true },
            { key: "cfsScore", label: "CFS", width: 95, isNumeric: true },
            { key: "gaeneScore", label: "GAENE", width: 95, isNumeric: true },
            { key: "mateScore", label: "MATE", width: 95, isNumeric: true },
            { key: "sbsScore", label: "SBS", width: 95, isNumeric: true },
            { key: "skepScore", label: "SKEP", width: 95, isNumeric: true },
            { key: "tsisSp", label: "TSIS-SP", width: 95, isNumeric: true },
            { key: "tsisSk", label: "TSIS-SK", width: 95, isNumeric: true },
            { key: "tsisSa", label: "TSIS-SA", width: 95, isNumeric: true },
            { key: "ncs6Score", label: "NCS-6", width: 95, isNumeric: true },
            { key: "cfqScore", label: "CFQ", width: 95, isNumeric: true },
            { key: "dass21Depression", label: "DASS-Dep", width: 120, isNumeric: true, badgeKey: "dass21DepressionSeverity" },
            { key: "dass21Anxiety", label: "DASS-Anx", width: 120, isNumeric: true, badgeKey: "dass21AnxietySeverity" },
            { key: "dass21Stress", label: "DASS-Str", width: 120, isNumeric: true, badgeKey: "dass21StressSeverity" },
            { key: "phq9Score", label: "PHQ-9", width: 115, isNumeric: true, badgeKey: "phq9Severity" },
            { key: "gad7Score", label: "GAD-7", width: 115, isNumeric: true, badgeKey: "gad7Severity" },
            { key: "who5Score", label: "WHO-5", width: 115, isNumeric: true, badgeKey: "who5Severity" },
          ]
        };
      } else {
        const qConf = QUESTIONNAIRE_CONFIGS[activeQuestionnaire] || { title: activeQuestionnaire.toUpperCase(), count: 10, description: "", badge: "", color: "#1e40af" };
        const rows = data.individualSheets[activeQuestionnaire] || [];
        
        const qCols: any[] = [
          { key: "idNumber", label: "Aadhaar / ID", width: 145, sticky: true, isId: true },
          { key: "username", label: "Username", width: 135, sticky: true },
          { key: "name", label: "Participant Name", width: 175, sticky: true, isName: true },
          { key: "schoolName", label: "School", width: 150 },
          { key: "createdAt", label: "Date", width: 120, isDate: true, isLastInGroup: true },
        ];

        // Add Q1 to Qn
        for (let i = 1; i <= qConf.count; i++) {
          qCols.push({ key: `q${i}`, label: `Q${i}`, width: 58, isNumeric: true, isAnswerItem: true });
        }

        // Add scores
        if (activeQuestionnaire === "tsis") {
          qCols.push(
            { key: "scoreSp", label: "Score SP", width: 100, isNumeric: true, bold: true },
            { key: "scoreSk", label: "Score SK", width: 100, isNumeric: true, bold: true },
            { key: "scoreSa", label: "Score SA", width: 100, isNumeric: true, bold: true }
          );
        } else if (activeQuestionnaire === "dass21") {
          qCols.push(
            { key: "scoreDepression", label: "Depression", width: 115, isNumeric: true, badgeKey: "severityDepression", bold: true },
            { key: "scoreAnxiety", label: "Anxiety", width: 115, isNumeric: true, badgeKey: "severityAnxiety", bold: true },
            { key: "scoreStress", label: "Stress", width: 115, isNumeric: true, badgeKey: "severityStress", bold: true }
          );
        } else if (["phq9", "gad7", "who5"].includes(activeQuestionnaire)) {
          qCols.push({ key: "score", label: "Final Score", width: 115, isNumeric: true, badgeKey: "severity", bold: true });
        } else {
          qCols.push({ key: "score", label: "Final Score", width: 115, isNumeric: true, bold: true });
        }

        return {
          currentRows: rows,
          sheetTitle: `${qConf.title}`,
          badgeText: `${qConf.count} Items`,
          badgeColor: qConf.color,
          columns: qCols,
        };
      }
    } else if (activeTab === "participants") {
      return {
        currentRows: data.participants,
        sheetTitle: "Participant Roster",
        badgeText: `${data.participants.length} Enrolled`,
        badgeColor: "#059669",
        columns: [
          { key: "idNumber", label: "Aadhaar / ID", width: 145, sticky: true, isId: true },
          { key: "username", label: "Username", width: 135, sticky: true },
          { key: "name", label: "Participant Name", width: 175, sticky: true, isName: true },
          { key: "age", label: "Age", width: 80, isNumeric: true },
          { key: "gender", label: "Gender", width: 95 },
          { key: "studentClass", label: "Class", width: 90 },
          { key: "schoolName", label: "School / Institution", width: 180 },
          { key: "phoneNo", label: "Phone", width: 135 },
          { key: "consentGiven", label: "Consent", width: 100, badgeKey: "consentGiven" },
          { key: "completed", label: "Status", width: 115, badgeKey: "completed" },
          { key: "cognitiveTestsCount", label: "Cognitive Tasks", width: 125, isNumeric: true },
          { key: "questionnairesAnsweredCount", label: "Surveys Done", width: 120, isNumeric: true },
          { key: "createdAt", label: "Enrolled Date", width: 135, isDate: true },
          { key: "actions", label: "Actions", width: 105, isAction: true },
        ]
      };
    } else {
      return {
        currentRows: data.rawTrials,
        sheetTitle: "Cognitive Raw Trial Logs",
        badgeText: `${data.rawTrials.length} Runs`,
        badgeColor: "#7c3aed",
        columns: [
          { key: "idNumber", label: "Aadhaar / ID", width: 145, sticky: true, isId: true },
          { key: "username", label: "Username", width: 135, sticky: true },
          { key: "name", label: "Participant Name", width: 165, sticky: true, isName: true },
          { key: "specificTest", label: "Test Name", width: 165, bold: true },
          { key: "category", label: "Category", width: 135 },
          { key: "param1Name", label: "Param 1 Name", width: 135 },
          { key: "param1Value", label: "Param 1 Val", width: 105, isNumeric: true },
          { key: "param2Name", label: "Param 2 Name", width: 135 },
          { key: "param2Value", label: "Param 2 Val", width: 105, isNumeric: true },
          { key: "param3Name", label: "Param 3 Name", width: 135 },
          { key: "param3Value", label: "Param 3 Val", width: 105, isNumeric: true },
          { key: "createdAt", label: "Timestamp", width: 140, isDate: true },
        ]
      };
    }
  }, [activeTab, activeQuestionnaire, data]);

  // ---- Responsive sizing helpers -------------------------------------------
  const GROUP_HEADER_H = isMobile ? 32 : 36;
  const stickyCount = isMobile ? 1 : columns.filter((c: any) => c.sticky).length;

  const colWidth = (col: any) => {
    if (!isMobile) return col.width;
    if (col.isId) return 105;
    if (col.isName) return 130;
    return Math.max(65, Math.round(col.width * 0.9));
  };

  const isColSticky = (col: any, idx: number) => Boolean(col.sticky) && idx < stickyCount;
  const stickyLeft = (col: any, idx: number) =>
    isColSticky(col, idx) ? (idx === 0 ? 0 : colWidth(columns[0])) : undefined;
  const isLastSticky = (col: any, idx: number) => isColSticky(col, idx) && idx === stickyCount - 1;

  const cellFont = isMobile ? (density === "compact" ? 11 : 12) : density === "compact" ? 12 : 13;
  const cellPad = density === "compact" ? (isMobile ? "8px 10px" : "10px 14px") : isMobile ? "10px 12px" : "13px 18px";
  const headerFont = isMobile ? 11 : density === "compact" ? 12 : 13;
  const headerPad = density === "compact" ? (isMobile ? "8px 10px" : "10px 14px") : isMobile ? "10px 12px" : "13px 18px";

  // Primary (top bar) action buttons
  const actionBtnStyle: React.CSSProperties = {
    padding: isMobile ? "10px 12px" : "8px 15px",
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 8,
    minHeight: 38,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    cursor: "pointer",
    width: isMobile ? "100%" : undefined,
    justifyContent: "center",
  };

  // Secondary (toolbar) buttons
  const toolBtnStyle: React.CSSProperties = {
    padding: isMobile ? "8px 12px" : "7px 12px",
    fontSize: isMobile ? 12 : 13,
    fontWeight: 600,
    borderRadius: 7,
    height: 38,
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    cursor: "pointer",
  };

  const pagerBtnStyle: React.CSSProperties = {
    padding: isMobile ? "8px 12px" : "6px 12px",
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 6,
  };

  // Filter and Sort rows
  const filteredAndSortedRows = useMemo(() => {
    let list = [...currentRows];

    // Filter Presets
    if (filterPreset === "completed") {
      list = list.filter(r => r.completed === "Completed" || r.cognitiveTestsCount === 9);
    } else if (filterPreset === "severe") {
      list = list.filter(r => {
        const d = r.dass21DepressionSeverity || r.severityDepression;
        const a = r.dass21AnxietySeverity || r.severityAnxiety;
        const s = r.dass21StressSeverity || r.severityStress;
        const p = r.phq9Severity;
        const g = r.gad7Severity;
        return [d, a, s, p, g].some(sev => sev === "Severe" || sev === "Extremely Severe" || sev === "Moderately Severe");
      });
    }

    // Search query Filter
    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase();
      list = list.filter((r) => {
        return Object.values(r).some((val) => {
          if (val === null || val === undefined) return false;
          if (typeof val === "object") return false;
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    // Sort
    if (sortKey) {
      list.sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];

        if (valA === null || valA === undefined || valA === "-") return 1;
        if (valB === null || valB === undefined || valB === "-") return -1;

        if (typeof valA === "number" && typeof valB === "number") {
          return sortOrder === "asc" ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        if (strA < strB) return sortOrder === "asc" ? -1 : 1;
        if (strA > strB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return list;
  }, [currentRows, searchTerm, filterPreset, sortKey, sortOrder]);

  // Dynamic Numeric Column Statistics Calculator
  const sheetStats = useMemo(() => {
    const numericCols = columns.filter(c => c.isNumeric && !c.isAnswerItem);
    const stats: Record<string, { avg: number; min: number; max: number; count: number }> = {};

    numericCols.forEach(col => {
      const vals = filteredAndSortedRows
        .map(r => r[col.key])
        .filter(v => typeof v === "number" && !isNaN(v)) as number[];

      if (vals.length > 0) {
        const sum = vals.reduce((a, b) => a + b, 0);
        stats[col.key] = {
          count: vals.length,
          avg: Math.round((sum / vals.length) * 10) / 10,
          min: Math.min(...vals),
          max: Math.max(...vals),
        };
      }
    });

    return stats;
  }, [columns, filteredAndSortedRows]);

  // Pagination calculation
  const totalRowsCount = filteredAndSortedRows.length;
  const paginatedRows = useMemo(() => {
    if (rowsPerPage === -1) return filteredAndSortedRows;
    const start = (currentPage - 1) * rowsPerPage;
    return filteredAndSortedRows.slice(start, start + rowsPerPage);
  }, [filteredAndSortedRows, currentPage, rowsPerPage]);

  const totalPages = rowsPerPage === -1 ? 1 : Math.ceil(totalRowsCount / rowsPerPage);

  // Sorting click handler
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  // Copy active table to clipboard in TSV (Excel paste-able)
  const handleCopyTSV = () => {
    try {
      const headers = columns.map(c => c.label).join("\t");
      const rows = filteredAndSortedRows.map(r => {
        return columns.map(c => {
          const val = r[c.key];
          return val === null || val === undefined ? "" : String(val);
        }).join("\t");
      }).join("\n");

      const tsvContent = `${headers}\n${rows}`;
      navigator.clipboard.writeText(tsvContent);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    } catch (e) {
      console.error("Failed to copy TSV:", e);
    }
  };

  // Export current active view as CSV
  const handleDownloadCSV = () => {
    try {
      const headers = columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(",");
      const rows = filteredAndSortedRows.map(r => {
        return columns.map(c => {
          const val = r[c.key];
          if (val === null || val === undefined) return '""';
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(",");
      }).join("\n");

      const csvContent = `${headers}\n${rows}`;
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${activeTab}_${activeQuestionnaire}_data.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Failed to download CSV:", e);
    }
  };

  // Selected participant dossier lookup
  const selectedParticipant = useMemo(() => {
    if (!selectedParticipantId) return null;
    return data.participants.find(p => p.sessionId === selectedParticipantId) || null;
  }, [selectedParticipantId, data.participants]);

  const selectedParticipantCognitive = useMemo(() => {
    if (!selectedParticipantId) return null;
    return data.cognitiveRows.find(c => c.sessionId === selectedParticipantId) || null;
  }, [selectedParticipantId, data.cognitiveRows]);

  const selectedParticipantQuestionnaires = useMemo(() => {
    if (!selectedParticipantId) return null;
    return data.questionnairesOverview.find(q => q.sessionId === selectedParticipantId) || null;
  }, [selectedParticipantId, data.questionnairesOverview]);

  const selectedParticipantRawTrials = useMemo(() => {
    if (!selectedParticipantId) return [];
    return data.rawTrials.filter(t => t.sessionId === selectedParticipantId);
  }, [selectedParticipantId, data.rawTrials]);

  // Render severity or status badge
  const renderBadge = (value: any) => {
    if (!value || value === "-") return <span style={{ color: "#cbd5e1" }}>-</span>;

    const str = String(value).trim();
    let bg = "#F1F5F9";
    let color = "#334155";
    let border = "#E2E8F0";
    let dotColor = "#94a3b8";

    if (str === "Normal" || str === "Minimal / Normal" || str === "Completed" || str === "Yes" || str === "Good Well-being") {
      bg = "#ECFDF5";
      color = "#047857";
      border = "#A7F3D0";
      dotColor = "#10b981";
    } else if (str === "Mild") {
      bg = "#FEF9C3";
      color = "#854D0E";
      border = "#FDE047";
      dotColor = "#eab308";
    } else if (str === "Moderate") {
      bg = "#FFEDD5";
      color = "#C2410C";
      border = "#FDBA74";
      dotColor = "#f97316";
    } else if (str === "Severe" || str === "Moderately Severe" || str === "Poor Well-being") {
      bg = "#FEF2F2";
      color = "#B91C1C";
      border = "#FECACA";
      dotColor = "#ef4444";
    } else if (str === "Extremely Severe" || str === "Incomplete" || str === "No") {
      bg = "#F5F3FF";
      color = "#6D28D9";
      border = "#DDD6FE";
      dotColor = "#8b5cf6";
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "2px 7px",
          borderRadius: 10,
          fontSize: 11,
          fontWeight: 600,
          backgroundColor: bg,
          color: color,
          border: `1px solid ${border}`,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: dotColor }} />
        {str}
      </span>
    );
  };

  // Group headers for cognitive table
  const groupHeaders = useMemo(() => {
    if (activeTab !== "cognitive") return null;
    const groups: { name: string; colSpan: number; meta?: typeof TASK_GROUP_META[string] }[] = [];
    let currentGroup = "";
    let currentCount = 0;

    columns.forEach(col => {
      const g = col.group || "General";
      if (g === currentGroup) {
        currentCount++;
      } else {
        if (currentGroup) {
          groups.push({ name: currentGroup, colSpan: currentCount, meta: TASK_GROUP_META[currentGroup] });
        }
        currentGroup = g;
        currentCount = 1;
      }
    });
    if (currentGroup) {
      groups.push({ name: currentGroup, colSpan: currentCount, meta: TASK_GROUP_META[currentGroup] });
    }
    return groups;
  }, [activeTab, columns]);

  return (
    <div
      className="admin-portal-wrapper"
      style={{
        width: "100%",
        maxWidth: "100%",
        paddingBottom: 20,
        position: isFullScreen ? "fixed" : "relative",
        top: isFullScreen ? 0 : "auto",
        left: isFullScreen ? 0 : "auto",
        right: isFullScreen ? 0 : "auto",
        bottom: isFullScreen ? 0 : "auto",
        zIndex: isFullScreen ? 999 : "auto",
        background: isFullScreen ? "#f8fafc" : "transparent",
        overflowY: isFullScreen ? "auto" : "visible",
        WebkitOverflowScrolling: "touch",
        padding: isFullScreen ? (isMobile ? "8px" : "12px") : undefined,
      }}
    >
      {/* Executive Top Header Bar */}
      <div
        className="card"
        style={{
          marginBottom: 16,
          padding: isMobile ? "16px 14px" : "18px 24px",
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          borderRadius: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "stretch" : "center",
            gap: 14,
          }}
        >
          {/* Left Title & Branding */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                boxShadow: "0 4px 10px rgba(30, 64, 175, 0.25)",
                flex: "0 0 auto",
              }}
            >
              🧠
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: -0.3 }}>
                  Admin & Clinical Intelligence Hub
                </h1>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    backgroundColor: "#ecfdf5",
                    color: "#047857",
                    border: "1px solid #a7f3d0",
                    padding: "3px 8px",
                    borderRadius: 12,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#10b981", boxShadow: "0 0 6px #10b981" }} />
                  Live Sync Active
                </span>
              </div>
              <p style={{ margin: "2px 0 0 0", fontSize: 13, color: "#64748b", fontWeight: 500 }}>
                AIIMS Kalyani Physiology & Cognitive Assessment Platform
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div
            style={{
              display: isMobile ? "grid" : "flex",
              gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : undefined,
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
              width: isMobile ? "100%" : undefined,
            }}
          >
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn btn-outline"
              style={actionBtnStyle}
              title="Pull newest records from PostgreSQL"
            >
              <span style={{ transform: isRefreshing ? "rotate(180deg)" : "none", transition: "transform 0.5s" }}>🔄</span>
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>

            <a
              href="/api/admin/export-data"
              className="btn btn-outline"
              style={actionBtnStyle}
              download
              title="Download 12-sheet Questionnaires Excel (.xlsx)"
            >
              <span>📥</span> Survey (.xlsx)
            </a>

            <a
              href="/api/admin/export-cognitive-data"
              className="btn btn-outline"
              style={{ ...actionBtnStyle, borderColor: "#a7f3d0", color: "#047857", backgroundColor: "#f0fdf4" }}
              download
              title="Download Cognitive Metrics Battery Excel (.xlsx)"
            >
              <span>📥</span> Cognitive (.xlsx)
            </a>

            <button
              onClick={handleSyncGoogleSheets}
              disabled={syncStatus === "loading"}
              className="btn"
              style={{ ...actionBtnStyle, backgroundColor: syncStatus === "success" ? "#10b981" : "#1e40af", color: "#ffffff" }}
              title="Send batch sync to connected Google Sheets"
            >
              <span>☁️</span>
              {syncStatus === "loading" ? "Syncing..." : syncStatus === "success" ? "Synced!" : "Sync Sheets"}
            </button>

            <button
              onClick={handleLogout}
              className="btn btn-outline"
              style={{ ...actionBtnStyle, borderColor: "#fecaca", color: "#dc2626", backgroundColor: "#fff5f5" }}
              title="Lock and Log Out of Admin Portal"
            >
              <span>🔒</span> Lock Portal
            </button>
          </div>
        </div>

        {/* Sync Status Alert */}
        {syncStatus !== "idle" && (
          <div
            style={{
              marginTop: 12,
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              backgroundColor: syncStatus === "success" ? "#ecfdf5" : syncStatus === "error" ? "#fef2f2" : "#eff6ff",
              color: syncStatus === "success" ? "#065f46" : syncStatus === "error" ? "#991b1b" : "#1e40af",
              border: `1px solid ${syncStatus === "success" ? "#a7f3d0" : syncStatus === "error" ? "#fecaca" : "#bfdbfe"}`
            }}
          >
            <span style={{ wordBreak: "break-word" }}>{syncMessage}</span>
            <button
              onClick={() => setSyncStatus("idle")}
              style={{ background: "none", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: 14 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Action Notification (e.g. Delete participant) */}
        {actionNotification && (
          <div
            style={{
              marginTop: 12,
              padding: "9px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              backgroundColor: actionNotification.type === "success" ? "#ecfdf5" : "#fef2f2",
              color: actionNotification.type === "success" ? "#065f46" : "#991b1b",
              border: `1px solid ${actionNotification.type === "success" ? "#a7f3d0" : "#fecaca"}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <span>{actionNotification.type === "success" ? "✅" : "⚠️"} {actionNotification.message}</span>
            <button
              onClick={() => setActionNotification(null)}
              style={{ background: "none", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: 14 }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Dedicated Spacious KPI Cards Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fit, minmax(220px, 1fr))",
          gap: isMobile ? 10 : 16,
          marginBottom: 16,
        }}
      >
        <div
          className="card"
          style={{
            padding: "16px 20px",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: 14,
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
            👥
          </div>
          <div>
            <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>
              {data.stats.totalParticipants}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginTop: 2 }}>
              Enrolled Participants
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "16px 20px",
            borderRadius: 12,
            border: "1px solid #a7f3d0",
            backgroundColor: "#f0fdf4",
            display: "flex",
            alignItems: "center",
            gap: 14,
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
            ✅
          </div>
          <div>
            <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "#047857", lineHeight: 1.1 }}>
              {data.stats.completedSessions}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#065f46", marginTop: 2 }}>
              Completed Assessments
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "16px 20px",
            borderRadius: 12,
            border: "1px solid #bfdbfe",
            backgroundColor: "#eff6ff",
            display: "flex",
            alignItems: "center",
            gap: 14,
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
            ⚡
          </div>
          <div>
            <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "#1e40af", lineHeight: 1.1 }}>
              {data.stats.totalCognitiveTests}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#1e3a8a", marginTop: 2 }}>
              Cognitive Task Runs
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "16px 20px",
            borderRadius: 12,
            border: "1px solid #e9d5ff",
            backgroundColor: "#faf5ff",
            display: "flex",
            alignItems: "center",
            gap: 14,
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: "#f3e8ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
            📋
          </div>
          <div>
            <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "#6b21a8", lineHeight: 1.1 }}>
              {data.stats.totalQuestionnaireAnswers}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#581c87", marginTop: 2 }}>
              Questionnaire Scales
            </div>
          </div>
        </div>
      </div>

      {/* Main Unified Table Card */}
      <div className="card" style={{ padding: "0px", overflow: "hidden", border: "1px solid #e2e8f0", borderRadius: 14, boxShadow: "0 4px 16px rgba(0,0,0,0.04)", backgroundColor: "#ffffff" }}>
        {/* Navigation Tabs Strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e2e8f0",
            padding: isMobile ? "8px 10px 0 10px" : "10px 18px 0 18px",
          }}
        >
          <div className="admin-scroll-x" style={{ display: "flex", gap: 6, overflowX: "auto", minWidth: 0, width: "100%" }}>
            <button
              onClick={() => setActiveTab("cognitive")}
              style={{
                padding: isMobile ? "10px 14px" : "12px 22px",
                whiteSpace: "nowrap",
                flex: "0 0 auto",
                border: "none",
                borderBottom: activeTab === "cognitive" ? "3px solid #1e40af" : "3px solid transparent",
                backgroundColor: activeTab === "cognitive" ? "#eff6ff" : "transparent",
                color: activeTab === "cognitive" ? "#1e40af" : "#64748b",
                fontWeight: activeTab === "cognitive" ? 800 : 600,
                fontSize: isMobile ? 13 : 14,
                cursor: "pointer",
                borderRadius: "8px 8px 0 0",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: 16 }}>🧠</span> Cognitive Matrix
              <span
                style={{
                  fontSize: 11,
                  background: activeTab === "cognitive" ? "#1e40af" : "#e2e8f0",
                  color: activeTab === "cognitive" ? "#ffffff" : "#475569",
                  padding: "1px 7px",
                  borderRadius: 10,
                  fontWeight: 700,
                }}
              >
                {data.cognitiveRows.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("questionnaires")}
              style={{
                padding: isMobile ? "10px 14px" : "12px 22px",
                whiteSpace: "nowrap",
                flex: "0 0 auto",
                border: "none",
                borderBottom: activeTab === "questionnaires" ? "3px solid #1e40af" : "3px solid transparent",
                backgroundColor: activeTab === "questionnaires" ? "#eff6ff" : "transparent",
                color: activeTab === "questionnaires" ? "#1e40af" : "#64748b",
                fontWeight: activeTab === "questionnaires" ? 800 : 600,
                fontSize: isMobile ? 13 : 14,
                cursor: "pointer",
                borderRadius: "8px 8px 0 0",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: 16 }}>📋</span> Questionnaires
              <span
                style={{
                  fontSize: 11,
                  background: activeTab === "questionnaires" ? "#1e40af" : "#e2e8f0",
                  color: activeTab === "questionnaires" ? "#ffffff" : "#475569",
                  padding: "1px 7px",
                  borderRadius: 10,
                  fontWeight: 700,
                }}
              >
                12
              </span>
            </button>

            <button
              onClick={() => setActiveTab("participants")}
              style={{
                padding: isMobile ? "10px 14px" : "12px 22px",
                whiteSpace: "nowrap",
                flex: "0 0 auto",
                border: "none",
                borderBottom: activeTab === "participants" ? "3px solid #1e40af" : "3px solid transparent",
                backgroundColor: activeTab === "participants" ? "#eff6ff" : "transparent",
                color: activeTab === "participants" ? "#1e40af" : "#64748b",
                fontWeight: activeTab === "participants" ? 800 : 600,
                fontSize: isMobile ? 13 : 14,
                cursor: "pointer",
                borderRadius: "8px 8px 0 0",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: 16 }}>👥</span> Participant Directory
              <span
                style={{
                  fontSize: 11,
                  background: activeTab === "participants" ? "#1e40af" : "#e2e8f0",
                  color: activeTab === "participants" ? "#ffffff" : "#475569",
                  padding: "1px 7px",
                  borderRadius: 10,
                  fontWeight: 700,
                }}
              >
                {data.participants.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("raw")}
              style={{
                padding: isMobile ? "10px 14px" : "12px 22px",
                whiteSpace: "nowrap",
                flex: "0 0 auto",
                border: "none",
                borderBottom: activeTab === "raw" ? "3px solid #1e40af" : "3px solid transparent",
                backgroundColor: activeTab === "raw" ? "#eff6ff" : "transparent",
                color: activeTab === "raw" ? "#1e40af" : "#64748b",
                fontWeight: activeTab === "raw" ? 800 : 600,
                fontSize: isMobile ? 13 : 14,
                cursor: "pointer",
                borderRadius: "8px 8px 0 0",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: 16 }}>🔬</span> Raw Trial Logs
              <span
                style={{
                  fontSize: 11,
                  background: activeTab === "raw" ? "#1e40af" : "#e2e8f0",
                  color: activeTab === "raw" ? "#ffffff" : "#475569",
                  padding: "1px 7px",
                  borderRadius: 10,
                  fontWeight: 700,
                }}
              >
                {data.rawTrials.length}
              </span>
            </button>
          </div>
        </div>

        {/* Filter, Search & Table Controls Toolbar */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "stretch" : "center",
            backgroundColor: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
            padding: isMobile ? "12px 14px" : "12px 20px",
            gap: 12,
          }}
        >
          {/* Left: Search Bar + Filter Preset Segmented Switch */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", width: isMobile ? "100%" : undefined }}>
            <div style={{ position: "relative", width: isMobile ? "100%" : 260 }}>
              <input
                type="text"
                placeholder="Search across all columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "8px 30px 8px 34px",
                  fontSize: 13,
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  width: "100%",
                  outline: "none",
                  height: 38,
                  boxSizing: "border-box",
                  backgroundColor: "#ffffff",
                }}
              />
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#94a3b8" }}>🔍</span>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                  style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14, padding: 2 }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Preset Pills */}
            <div style={{ display: "flex", backgroundColor: "#e2e8f0", padding: 3, borderRadius: 8, gap: 2, width: isMobile ? "100%" : undefined }}>
              <button
                onClick={() => setFilterPreset("all")}
                style={{
                  padding: "6px 14px",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  flex: isMobile ? 1 : undefined,
                  backgroundColor: filterPreset === "all" ? "#ffffff" : "transparent",
                  color: filterPreset === "all" ? "#0f172a" : "#64748b",
                  boxShadow: filterPreset === "all" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                All ({currentRows.length})
              </button>
              <button
                onClick={() => setFilterPreset("completed")}
                style={{
                  padding: "6px 14px",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  flex: isMobile ? 1 : undefined,
                  backgroundColor: filterPreset === "completed" ? "#ffffff" : "transparent",
                  color: filterPreset === "completed" ? "#059669" : "#64748b",
                  boxShadow: filterPreset === "completed" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                Completed
              </button>
              <button
                onClick={() => setFilterPreset("severe")}
                style={{
                  padding: "6px 14px",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  flex: isMobile ? 1 : undefined,
                  backgroundColor: filterPreset === "severe" ? "#ffffff" : "transparent",
                  color: filterPreset === "severe" ? "#dc2626" : "#64748b",
                  boxShadow: filterPreset === "severe" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                Severe
              </button>
            </div>
          </div>

          {/* Right: Table View Options & Export Controls */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
              width: isMobile ? "100%" : undefined,
            }}
          >
            {/* Density Toggle */}
            <button
              onClick={() => setDensity((d) => (d === "compact" ? "comfortable" : "compact"))}
              className="btn btn-outline"
              style={toolBtnStyle}
              title="Toggle Compact/Comfortable row height"
            >
              {density === "compact" ? "📏 Compact" : "📐 Spaced"}
            </button>

            {/* Stats Toggle */}
            <button
              onClick={() => setShowStatsBar((v) => !v)}
              className="btn btn-outline"
              style={toolBtnStyle}
              title="Toggle summary metrics"
            >
              📊 Stats
            </button>

            {/* Copy TSV */}
            <button
              onClick={handleCopyTSV}
              className="btn btn-outline"
              style={toolBtnStyle}
              title="Copy active sheet for Excel"
            >
              <span>📋</span> {copyFeedback ? "Copied!" : "Copy TSV"}
            </button>

            {/* Download CSV */}
            <button
              onClick={handleDownloadCSV}
              className="btn btn-outline"
              style={toolBtnStyle}
              title="Download CSV"
            >
              <span>💾</span> Export CSV
            </button>

            {/* Full Screen Toggle */}
            <button
              onClick={() => setIsFullScreen((f) => !f)}
              className="btn btn-outline"
              style={toolBtnStyle}
              title="Fullscreen"
            >
              {isFullScreen ? "🗗 Exit Fullscreen" : "⛶ Fullscreen"}
            </button>

            {/* Rows Per Page */}
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              aria-label="Rows per page"
              style={{
                padding: "6px 10px",
                fontSize: 13,
                border: "1px solid #cbd5e1",
                borderRadius: 7,
                backgroundColor: "white",
                color: "#334155",
                outline: "none",
                cursor: "pointer",
                height: 38,
                fontWeight: 600,
              }}
            >
              <option value={15}>15 rows</option>
              <option value={25}>25 rows</option>
              <option value={50}>50 rows</option>
              <option value={-1}>All rows</option>
            </select>
          </div>
        </div>

        {/* Sub-Bar: Quick Task Jump (Cognitive) OR Questionnaire Sheet Chips */}
        {activeTab === "cognitive" ? (
          <div
            className="admin-scroll-x"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: isMobile ? "10px 12px" : "10px 20px",
              backgroundColor: "#ffffff",
              borderBottom: "1px solid #e2e8f0",
              overflowX: "auto",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 800, color: "#475569", textTransform: "uppercase", whiteSpace: "nowrap", marginRight: 4, display: "flex", alignItems: "center", gap: 4 }}>
              <span>🎯</span> Task Jump:
            </span>
            {groupHeaders?.map((g) => (
              <button
                key={g.name}
                type="button"
                onClick={() => scrollToGroup(g.name)}
                style={{
                  border: `1px solid ${g.meta?.borderColor || "#cbd5e1"}`,
                  background: g.meta?.headerBg || "#ffffff",
                  color: g.meta?.pillColor || "#334155",
                  padding: isMobile ? "8px 12px" : "5px 12px",
                  borderRadius: 6,
                  fontSize: isMobile ? 12 : 12,
                  flex: "0 0 auto",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                }}
              >
                <span>{g.meta?.icon}</span>
                <span>{g.name}</span>
              </button>
            ))}
          </div>
        ) : activeTab === "questionnaires" ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              padding: isMobile ? "10px 12px" : "10px 20px",
              backgroundColor: "#ffffff",
              borderBottom: "1px solid #e2e8f0",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => setActiveQuestionnaire("overview")}
              style={{
                padding: "6px 14px",
                fontSize: 12,
                borderRadius: 6,
                border: activeQuestionnaire === "overview" ? "1px solid #1e40af" : "1px solid #cbd5e1",
                backgroundColor: activeQuestionnaire === "overview" ? "#1e40af" : "#ffffff",
                color: activeQuestionnaire === "overview" ? "#ffffff" : "#334155",
                fontWeight: activeQuestionnaire === "overview" ? 800 : 600,
                cursor: "pointer",
                boxShadow: activeQuestionnaire === "overview" ? "0 2px 6px rgba(30,64,175,0.2)" : "none",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span>⭐</span> Overview
            </button>

            {Object.entries(QUESTIONNAIRE_CONFIGS).map(([id, conf]) => {
              const isSelected = activeQuestionnaire === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveQuestionnaire(id)}
                  style={{
                    padding: "6px 12px",
                    fontSize: 12,
                    borderRadius: 6,
                    border: isSelected ? `1px solid ${conf.color}` : "1px solid #cbd5e1",
                    backgroundColor: isSelected ? conf.color : "#ffffff",
                    color: isSelected ? "#ffffff" : "#334155",
                    fontWeight: isSelected ? 800 : 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    boxShadow: isSelected ? "0 2px 6px rgba(0,0,0,0.15)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>{id.toUpperCase()}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Statistical Aggregate Summary Strip (when enabled) */}
        {showStatsBar && Object.keys(sheetStats).length > 0 && (
          <div
            className="admin-scroll-x"
            style={{
              display: "flex",
              gap: 6,
              padding: isMobile ? "6px 8px" : "4px 10px",
              backgroundColor: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
              overflowX: "auto",
              fontSize: isMobile ? 11 : 10,
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 700, color: "#1e40af", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
              <span>📈</span> Averages:
            </span>
            {Object.entries(sheetStats).slice(0, 8).map(([key, st]) => {
              const col = columns.find(c => c.key === key);
              return (
                <div
                  key={key}
                  style={{
                    background: "white",
                    padding: "2px 6px",
                    borderRadius: 4,
                    border: "1px solid #cbd5e1",
                    whiteSpace: "nowrap",
                    display: "flex",
                    gap: 4
                  }}
                >
                  <span style={{ color: "#64748b" }}>{col?.label || key}:</span>
                  <strong style={{ color: "#0f172a" }}>{st.avg}</strong>
                </div>
              );
            })}
          </div>
        )}

        {/* Horizontal-scroll affordance (phones only) */}
        {isMobile && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              padding: "5px 10px",
              fontSize: 10,
              color: "#64748b",
              backgroundColor: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <span>↔ Swipe the grid for more columns</span>
            <span style={{ whiteSpace: "nowrap" }}>Tap a row for full details</span>
          </div>
        )}

        {/* Data Grid Table Wrapper */}
        <div
          ref={tableWrapperRef}
          className="sheet-table-wrapper"
          style={{
            width: "100%",
            overflowX: "auto",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorX: "contain",
            maxHeight: isFullScreen ? (isMobile ? "80vh" : "86vh") : isMobile ? "62vh" : "75vh",
            position: "relative",
            backgroundColor: "#ffffff",
          }}
        >
          <table
            style={{
              width: "max-content",
              minWidth: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              fontSize: cellFont,
              fontFamily: "inherit",
            }}
          >
            <thead>
              {/* Group Super Headers (For Cognitive Sheet) */}
              {groupHeaders && (
                <tr style={{ position: "sticky", top: 0, zIndex: 20 }}>
                  {groupHeaders.map((g, idx) => (
                    <th
                      key={idx}
                      id={`group-header-${g.name.replace(/\s+/g, '-').toLowerCase()}`}
                      colSpan={g.colSpan}
                      style={{
                        background: g.meta?.bgGradient || "#1e40af",
                        color: "white",
                        padding: "6px 8px",
                        height: GROUP_HEADER_H,
                        textAlign: "center",
                        fontSize: isMobile ? 10 : 11,
                        fontWeight: 700,
                        letterSpacing: 0.3,
                        borderRight: "2px solid rgba(255,255,255,0.35)",
                        borderBottom: "1px solid #cbd5e1",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
                      }}
                    >
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <span>{g.meta?.icon}</span>
                        <span>{g.meta?.label || g.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              )}

              {/* Column Headers */}
              <tr style={{ position: "sticky", top: groupHeaders ? GROUP_HEADER_H : 0, zIndex: 19 }}>
                {columns.map((col, idx) => {
                  const isSorted = sortKey === col.key;
                  const groupMeta = col.group ? TASK_GROUP_META[col.group] : null;
                  const isLastCol = col.isLastInGroup;

                  return (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      style={{
                        backgroundColor: groupMeta ? groupMeta.headerBg : "#f8fafc",
                        color: groupMeta ? groupMeta.pillColor : "#1e293b",
                        padding: headerPad,
                        textAlign: col.isNumeric ? "right" : "left",
                        fontSize: headerFont,
                        fontWeight: 700,
                        borderBottom: "2px solid #cbd5e1",
                        borderRight: isLastCol ? "2px solid #94a3b8" : "1px solid #e2e8f0",
                        width: colWidth(col),
                        minWidth: colWidth(col),
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        userSelect: "none",
                        position: isColSticky(col, idx) ? "sticky" : "static",
                        left: stickyLeft(col, idx),
                        zIndex: isColSticky(col, idx) ? 25 : undefined,
                        boxShadow: isLastSticky(col, idx) ? "3px 0 6px -2px rgba(0,0,0,0.12)" : undefined,
                        transition: "background 0.15s",
                      }}
                      title={`Click to sort by ${col.label}`}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: col.isNumeric ? "flex-end" : "flex-start", gap: 4 }}>
                        <span>{col.label}</span>
                        {isSorted && (
                          <span style={{ fontSize: 10, color: "#1e40af", fontWeight: "bold" }}>
                            {sortOrder === "asc" ? "▲" : "▼"}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    style={{ padding: "40px 16px", textAlign: "center", color: "#64748b", fontSize: 13 }}
                  >
                    No entries match your query or filters.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, rowIdx) => {
                  const isEven = rowIdx % 2 === 0;
                  return (
                    <tr
                      key={row.sessionId || row.id || rowIdx}
                      onClick={() => setSelectedParticipantId(row.sessionId || row.id)}
                      style={{
                        backgroundColor: isEven ? "#ffffff" : "#f8fafc",
                        transition: "background 0.12s, box-shadow 0.12s",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#e0f2fe"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isEven ? "#ffffff" : "#f8fafc"; }}
                      title="Click to open participant dossier"
                    >
                      {columns.map((col, cIdx) => {
                        const rawVal = row[col.key];
                        const isLastCol = col.isLastInGroup;
                        let displayVal: any = rawVal;

                        if (col.isDate && rawVal) {
                          try {
                            displayVal = new Date(rawVal).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            });
                          } catch {
                            displayVal = String(rawVal);
                          }
                        }

                        return (
                          <td
                            key={col.key}
                            style={{
                              padding: cellPad,
                              textAlign: col.isNumeric ? "right" : "left",
                              borderBottom: "1px solid #e2e8f0",
                              borderRight: isLastCol ? "2px solid #cbd5e1" : "1px solid #f1f5f9",
                              fontSize: cellFont,
                              fontVariantNumeric: "tabular-nums",
                              fontWeight: col.bold ? 700 : 400,
                              color: col.bold ? "#0f172a" : "#334155",
                              whiteSpace: isMobile ? "nowrap" : undefined,
                              position: isColSticky(col, cIdx) ? "sticky" : "static",
                              left: stickyLeft(col, cIdx),
                              backgroundColor: isColSticky(col, cIdx) ? (isEven ? "#ffffff" : "#f8fafc") : "inherit",
                              zIndex: isColSticky(col, cIdx) ? 10 : undefined,
                              boxShadow: isLastSticky(col, cIdx) ? "3px 0 6px -2px rgba(0,0,0,0.1)" : undefined,
                            }}
                          >
                            {col.isAction ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingParticipant({
                                    sessionId: row.sessionId || row.id,
                                    name: row.name,
                                    idNumber: row.idNumber,
                                  });
                                }}
                                style={{
                                  padding: "3px 8px",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: "#dc2626",
                                  backgroundColor: "#fef2f2",
                                  border: "1px solid #fecaca",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = "#fee2e2";
                                  e.currentTarget.style.borderColor = "#f87171";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = "#fef2f2";
                                  e.currentTarget.style.borderColor = "#fecaca";
                                }}
                                title="Delete participant and all records"
                              >
                                <span>🗑️</span> Delete
                              </button>
                            ) : col.badgeKey ? (
                              <div style={{ display: "flex", alignItems: "center", justifyContent: col.isNumeric ? "flex-end" : "flex-start", gap: 4 }}>
                                {col.isNumeric && rawVal !== null && <span>{rawVal}</span>}
                                {renderBadge(row[col.badgeKey] || rawVal)}
                              </div>
                            ) : col.isId && rawVal ? (
                              <span
                                style={{
                                  fontFamily: "monospace",
                                  fontWeight: 700,
                                  backgroundColor: "#f1f5f9",
                                  border: "1px solid #e2e8f0",
                                  padding: "1px 5px",
                                  borderRadius: 4,
                                  color: "#0f172a",
                                  fontSize: 11
                                }}
                              >
                                {rawVal}
                              </span>
                            ) : col.isName && rawVal ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#dbeafe", color: "#1e40af", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 }}>
                                  {String(rawVal).charAt(0).toUpperCase()}
                                </span>
                                <span style={{ fontWeight: 600, color: "#0f172a" }}>{rawVal}</span>
                              </div>
                            ) : col.isHighlightPill && rawVal !== null && rawVal !== undefined ? (
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "1px 5px",
                                  borderRadius: 4,
                                  backgroundColor: `${col.color || "#2563eb"}15`,
                                  color: col.color || "#2563eb",
                                  fontWeight: 700,
                                  fontSize: 11
                                }}
                              >
                                {rawVal} {col.key.includes("Effect") ? "ms" : ""}
                              </span>
                            ) : rawVal === null || rawVal === undefined ? (
                              <span style={{ color: "#cbd5e1", fontSize: 12, userSelect: "none" }}>—</span>
                            ) : (
                              displayVal
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer & Pagination */}
        <div style={{ padding: isMobile ? "12px 14px" : "14px 20px", borderTop: "1px solid #e2e8f0", backgroundColor: "#f8fafc", display: "flex", flexWrap: "wrap", justifyContent: isMobile ? "center" : "space-between", alignItems: "center", gap: 10, fontSize: 13, color: "#64748b", textAlign: "center" }}>
          <div>
            Showing <strong style={{ color: "#0f172a" }}>{paginatedRows.length}</strong> of <strong style={{ color: "#0f172a" }}>{totalRowsCount}</strong> entries
            {searchTerm && ` (filtered)`}
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 6, width: isMobile ? "100%" : undefined }}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="btn btn-outline"
                style={pagerBtnStyle}
              >
                ⏮ First
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn btn-outline"
                style={pagerBtnStyle}
              >
                ◀ Prev
              </button>
              <span style={{ padding: "0 8px", fontWeight: 700, color: "#0f172a" }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-outline"
                style={pagerBtnStyle}
              >
                Next ▶
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="btn btn-outline"
                style={pagerBtnStyle}
              >
                Last ⏭
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Participant Dossier Modal */}
      {selectedParticipant && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: isMobile ? "flex-start" : "center",
            zIndex: 1000,
            padding: isMobile ? 8 : 16,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
          }}
          onClick={() => setSelectedParticipantId(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: 860,
              width: "100%",
              maxHeight: isMobile ? "94vh" : "92vh",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              padding: isMobile ? "16px 14px" : "24px 28px",
              backgroundColor: "white",
              borderRadius: 12,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dossier Header */}
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10, borderBottom: "1px solid #e2e8f0", paddingBottom: 16, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1e40af", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Clinical & Cognitive Dossier
                </div>
                <h2 style={{ fontSize: isMobile ? 17 : 22, fontWeight: 700, margin: "2px 0 0 0", color: "#0f172a", wordBreak: "break-word" }}>
                  {selectedParticipant.name} ({selectedParticipant.idNumber || "No ID"})
                </h2>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  Session ID: <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, wordBreak: "break-all" }}>{selectedParticipant.sessionId}</code>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", width: isMobile ? "100%" : undefined, justifyContent: isMobile ? "flex-end" : undefined }}>
                <button
                  onClick={() => window.print()}
                  className="btn btn-outline"
                  style={{ padding: "6px 12px", fontSize: 12 }}
                  title="Print participant dossier"
                >
                  🖨️ Print
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeletingParticipant({
                      sessionId: selectedParticipant.sessionId,
                      name: selectedParticipant.name,
                      idNumber: selectedParticipant.idNumber,
                    });
                  }}
                  className="btn btn-outline"
                  style={{
                    padding: "6px 12px",
                    fontSize: 12,
                    color: "#dc2626",
                    borderColor: "#fecaca",
                    backgroundColor: "#fff5f5",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    cursor: "pointer",
                  }}
                  title="Delete participant and all records"
                >
                  <span>🗑️</span> Delete
                </button>
                <button
                  onClick={() => setSelectedParticipantId(null)}
                  style={{
                    border: "none",
                    background: "#f1f5f9",
                    borderRadius: "50%",
                    width: isMobile ? 36 : 32,
                    height: isMobile ? 36 : 32,
                    flex: "0 0 auto",
                    fontSize: 16,
                    cursor: "pointer",
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Demographics Strip */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 18, backgroundColor: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <div>
                <span style={{ fontSize: 10, color: "#64748b", display: "block", textTransform: "uppercase", fontWeight: 600 }}>Age / Gender</span>
                <strong style={{ fontSize: 13, color: "#0f172a" }}>{selectedParticipant.age || "-"} yrs / {selectedParticipant.gender || "-"}</strong>
              </div>
              <div>
                <span style={{ fontSize: 10, color: "#64748b", display: "block", textTransform: "uppercase", fontWeight: 600 }}>School & Class</span>
                <strong style={{ fontSize: 13, color: "#0f172a" }}>{selectedParticipant.schoolName || "-"} (Class {selectedParticipant.studentClass || "-"})</strong>
              </div>
              <div>
                <span style={{ fontSize: 10, color: "#64748b", display: "block", textTransform: "uppercase", fontWeight: 600 }}>Contact Phone</span>
                <strong style={{ fontSize: 13, color: "#0f172a" }}>{selectedParticipant.phoneNo || "-"}</strong>
              </div>
              <div>
                <span style={{ fontSize: 10, color: "#64748b", display: "block", textTransform: "uppercase", fontWeight: 600 }}>Status</span>
                <strong style={{ fontSize: 13, color: "#0f172a" }}>{selectedParticipant.completed} (Consent: {selectedParticipant.consentGiven})</strong>
              </div>
            </div>

            {/* Dossier Tabs */}
            <div className="admin-scroll-x" style={{ display: "flex", borderBottom: "1px solid #e2e8f0", gap: 8, marginBottom: 16, overflowX: "auto" }}>
              <button
                onClick={() => setDossierTab("clinical")}
                style={{
                  padding: isMobile ? "9px 10px" : "8px 14px",
                  whiteSpace: "nowrap",
                  flex: "0 0 auto",
                  border: "none",
                  borderBottom: dossierTab === "clinical" ? "2px solid #1e40af" : "2px solid transparent",
                  backgroundColor: "transparent",
                  color: dossierTab === "clinical" ? "#1e40af" : "#64748b",
                  fontWeight: dossierTab === "clinical" ? 700 : 500,
                  fontSize: isMobile ? 12 : 13,
                  cursor: "pointer",
                }}
              >
                📋 Clinical Scales
              </button>
              <button
                onClick={() => setDossierTab("cognitive")}
                style={{
                  padding: isMobile ? "9px 10px" : "8px 14px",
                  whiteSpace: "nowrap",
                  flex: "0 0 auto",
                  border: "none",
                  borderBottom: dossierTab === "cognitive" ? "2px solid #1e40af" : "2px solid transparent",
                  backgroundColor: "transparent",
                  color: dossierTab === "cognitive" ? "#1e40af" : "#64748b",
                  fontWeight: dossierTab === "cognitive" ? 700 : 500,
                  fontSize: isMobile ? 12 : 13,
                  cursor: "pointer",
                }}
              >
                🧠 Cognitive Battery
              </button>
              <button
                onClick={() => setDossierTab("raw")}
                style={{
                  padding: isMobile ? "9px 10px" : "8px 14px",
                  whiteSpace: "nowrap",
                  flex: "0 0 auto",
                  border: "none",
                  borderBottom: dossierTab === "raw" ? "2px solid #1e40af" : "2px solid transparent",
                  backgroundColor: "transparent",
                  color: dossierTab === "raw" ? "#1e40af" : "#64748b",
                  fontWeight: dossierTab === "raw" ? 700 : 500,
                  fontSize: isMobile ? 12 : 13,
                  cursor: "pointer",
                }}
              >
                🔬 Raw Trial Logs ({selectedParticipantRawTrials.length})
              </button>
            </div>

            {/* Clinical Tab Content */}
            {dossierTab === "clinical" && selectedParticipantQuestionnaires && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(1, minmax(0, 1fr))" : "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                <div style={{ padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, background: "white" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>DASS-21 Depression</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{selectedParticipantQuestionnaires.dass21Depression ?? "-"}</span>
                    {renderBadge(selectedParticipantQuestionnaires.dass21DepressionSeverity)}
                  </div>
                </div>
                <div style={{ padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, background: "white" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>DASS-21 Anxiety</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{selectedParticipantQuestionnaires.dass21Anxiety ?? "-"}</span>
                    {renderBadge(selectedParticipantQuestionnaires.dass21AnxietySeverity)}
                  </div>
                </div>
                <div style={{ padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, background: "white" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>DASS-21 Stress</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{selectedParticipantQuestionnaires.dass21Stress ?? "-"}</span>
                    {renderBadge(selectedParticipantQuestionnaires.dass21StressSeverity)}
                  </div>
                </div>
                <div style={{ padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, background: "white" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>PHQ-9 Depression</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{selectedParticipantQuestionnaires.phq9Score ?? "-"}</span>
                    {renderBadge(selectedParticipantQuestionnaires.phq9Severity)}
                  </div>
                </div>
                <div style={{ padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, background: "white" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>GAD-7 Anxiety</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{selectedParticipantQuestionnaires.gad7Score ?? "-"}</span>
                    {renderBadge(selectedParticipantQuestionnaires.gad7Severity)}
                  </div>
                </div>
                <div style={{ padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, background: "white" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>WHO-5 Well-Being</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{selectedParticipantQuestionnaires.who5Score ?? "-"}</span>
                    {renderBadge(selectedParticipantQuestionnaires.who5Severity)}
                  </div>
                </div>
              </div>
            )}

            {/* Cognitive Tab Content */}
            {dossierTab === "cognitive" && selectedParticipantCognitive && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
                <div style={{ padding: 10, background: "#eff6ff", borderRadius: 8, border: "1px solid #bfdbfe" }}>
                  <div style={{ fontSize: 11, color: "#1e40af", fontWeight: 700 }}>Stroop Effect</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{selectedParticipantCognitive.stroopEffect ?? "-"} ms</div>
                </div>
                <div style={{ padding: 10, background: "#ecfdf5", borderRadius: 8, border: "1px solid #a7f3d0" }}>
                  <div style={{ fontSize: 11, color: "#065f46", fontWeight: 700 }}>SART RT Go</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{selectedParticipantCognitive.sartRt ?? "-"} ms</div>
                </div>
                <div style={{ padding: 10, background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca" }}>
                  <div style={{ fontSize: 11, color: "#991b1b", fontWeight: 700 }}>Dot Probe Bias</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{selectedParticipantCognitive.dotProbeBias ?? "-"}</div>
                </div>
                <div style={{ padding: 10, background: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a" }}>
                  <div style={{ fontSize: 11, color: "#92400e", fontWeight: 700 }}>2-Back Hit Rate</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{selectedParticipantCognitive.nbackHitRate ?? "-"}%</div>
                </div>
                <div style={{ padding: 10, background: "#f5f3ff", borderRadius: 8, border: "1px solid #ddd6fe" }}>
                  <div style={{ fontSize: 11, color: "#5b21b6", fontWeight: 700 }}>Corsi Max Span</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{selectedParticipantCognitive.corsiMaxSpan ?? "-"}</div>
                </div>
                <div style={{ padding: 10, background: "#ecfeff", borderRadius: 8, border: "1px solid #a5f3fc" }}>
                  <div style={{ fontSize: 11, color: "#155e75", fontWeight: 700 }}>Digit Span Max</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{selectedParticipantCognitive.digitSpanMax ?? "-"}</div>
                </div>
                <div style={{ padding: 10, background: "#f8fafc", borderRadius: 8, border: "1px solid #cbd5e1" }}>
                  <div style={{ fontSize: 11, color: "#334155", fontWeight: 700 }}>LDT Accuracy</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{selectedParticipantCognitive.ldtAccuracy ?? "-"}%</div>
                </div>
                <div style={{ padding: 10, background: "#fdf2f8", borderRadius: 8, border: "1px solid #fbcfe8" }}>
                  <div style={{ fontSize: 11, color: "#9d174d", fontWeight: 700 }}>Priming Effect</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{selectedParticipantCognitive.npEffect ?? "-"} ms</div>
                </div>
                <div style={{ padding: 10, background: "#f7fee7", borderRadius: 8, border: "1px solid #d9f99d" }}>
                  <div style={{ fontSize: 11, color: "#3f6212", fontWeight: 700 }}>Flanker Effect</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{selectedParticipantCognitive.flankerEffect ?? "-"} ms</div>
                </div>
              </div>
            )}

            {/* Raw Trials Inspector in Dossier */}
            {dossierTab === "raw" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  type="text"
                  placeholder="Filter participant trial logs..."
                  value={rawTrialSearch}
                  onChange={(e) => setRawTrialSearch(e.target.value)}
                  style={{
                    padding: isMobile ? "8px 12px" : "6px 12px",
                    fontSize: isMobile ? 13 : 12,
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    width: isMobile ? "100%" : 240,
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
                {isMobile ? (
                  <div style={{ maxHeight: 340, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                    {selectedParticipantRawTrials
                      .filter((t) => t.specificTest.toLowerCase().includes(rawTrialSearch.toLowerCase()))
                      .map((t) => (
                        <div key={t.id} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 10, background: "#ffffff" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                            <strong style={{ fontSize: 12, color: "#0f172a" }}>{t.specificTest}</strong>
                            <span style={{ fontSize: 10, color: "#64748b", whiteSpace: "nowrap" }}>
                              {new Date(t.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6, fontSize: 11, color: "#475569" }}>
                            <div>{t.param1Name}: <strong style={{ color: "#0f172a" }}>{t.param1Value}</strong></div>
                            <div>{t.param2Name}: <strong style={{ color: "#0f172a" }}>{t.param2Value}</strong></div>
                            <div>{t.param3Name}: <strong style={{ color: "#0f172a" }}>{t.param3Value}</strong></div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 6 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                          <th style={{ padding: "6px 10px", textAlign: "left" }}>Task</th>
                          <th style={{ padding: "6px 10px", textAlign: "left" }}>Param 1</th>
                          <th style={{ padding: "6px 10px", textAlign: "left" }}>Param 2</th>
                          <th style={{ padding: "6px 10px", textAlign: "left" }}>Param 3</th>
                          <th style={{ padding: "6px 10px", textAlign: "left" }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedParticipantRawTrials
                          .filter(t => t.specificTest.toLowerCase().includes(rawTrialSearch.toLowerCase()))
                          .map(t => (
                            <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "6px 10px", fontWeight: 600, color: "#0f172a" }}>{t.specificTest}</td>
                              <td style={{ padding: "6px 10px" }}>{t.param1Name}: <strong>{t.param1Value}</strong></td>
                              <td style={{ padding: "6px 10px" }}>{t.param2Name}: <strong>{t.param2Value}</strong></td>
                              <td style={{ padding: "6px 10px" }}>{t.param3Name}: <strong>{t.param3Value}</strong></td>
                              <td style={{ padding: "6px 10px", color: "#64748b" }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: isMobile ? "stretch" : "flex-end", marginTop: 20 }}>
              <button
                onClick={() => setSelectedParticipantId(null)}
                className="btn"
                style={{ padding: isMobile ? "12px 20px" : "8px 20px", width: isMobile ? "100%" : undefined }}
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingParticipant && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1100,
            padding: 16,
          }}
          onClick={() => !isDeleting && setDeletingParticipant(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: 480,
              width: "100%",
              backgroundColor: "#ffffff",
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.04)",
              border: "1px solid #fee2e2",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  backgroundColor: "#fee2e2",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                ⚠️
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#991b1b" }}>
                  Delete Participant?
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                  This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Details Box */}
            <div
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                fontSize: 13,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#64748b" }}>Participant Name:</span>
                <strong style={{ color: "#0f172a" }}>{deletingParticipant.name || "N/A"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#64748b" }}>Aadhaar / ID:</span>
                <code style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: 4, color: "#0f172a" }}>
                  {deletingParticipant.idNumber || "N/A"}
                </code>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Session ID:</span>
                <code style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: 4, color: "#0f172a", fontSize: 11 }}>
                  {deletingParticipant.sessionId.slice(0, 8)}...
                </code>
              </div>
            </div>

            <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, marginBottom: 20 }}>
              Deleting this participant will permanently remove their enrollment record, all 12 questionnaire scale responses, normalized answers, and all cognitive test results from the database.
            </p>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setDeletingParticipant(null)}
                disabled={isDeleting}
                className="btn btn-outline"
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isDeleting ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteParticipant}
                disabled={isDeleting}
                className="btn"
                style={{
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 8,
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 2px 4px rgba(220, 38, 38, 0.3)",
                }}
              >
                <span>{isDeleting ? "⏳" : "🗑️"}</span>
                {isDeleting ? "Deleting..." : "Yes, Delete Participant"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
