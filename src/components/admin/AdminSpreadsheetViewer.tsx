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
  const [density, setDensity] = useState<"comfortable" | "compact">("compact");
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
      // Offset by the sticky participant columns (115px + 155px = 270px) + margin
      const stickyColumnsWidth = 270;
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
          { key: "idNumber", label: "ID Number", group: "Participant", width: 115, sticky: true, isId: true },
          { key: "name", label: "Participant Name", group: "Participant", width: 155, sticky: true, isName: true },
          { key: "schoolName", label: "School / Institution", group: "Participant", width: 140 },
          { key: "createdAt", label: "Date", group: "Participant", width: 110, isDate: true, isLastInGroup: true },
          // Stroop
          { key: "stroopCongruent", label: "RT Cong (ms)", group: "Stroop Task", color: "#2563eb", width: 110, isNumeric: true },
          { key: "stroopIncongruent", label: "RT Incong (ms)", group: "Stroop Task", color: "#2563eb", width: 115, isNumeric: true },
          { key: "stroopEffect", label: "Stroop Effect", group: "Stroop Task", color: "#2563eb", width: 110, isNumeric: true, bold: true, isHighlightPill: true, isLastInGroup: true },
          // SART
          { key: "sartRt", label: "RT Go (ms)", group: "SART", color: "#059669", width: 105, isNumeric: true },
          { key: "sartCommission", label: "Comm Errors", group: "SART", color: "#059669", width: 105, isNumeric: true },
          { key: "sartOmission", label: "Omiss Errors", group: "SART", color: "#059669", width: 105, isNumeric: true, isLastInGroup: true },
          // Dot Probe
          { key: "dotProbeCongruent", label: "RT Cong (ms)", group: "Dot Probe", color: "#dc2626", width: 110, isNumeric: true },
          { key: "dotProbeIncongruent", label: "RT Incong (ms)", group: "Dot Probe", color: "#dc2626", width: 115, isNumeric: true },
          { key: "dotProbeBias", label: "Bias Score", group: "Dot Probe", color: "#dc2626", width: 105, isNumeric: true, bold: true, isHighlightPill: true, isLastInGroup: true },
          // 2-Back
          { key: "nbackMeanRT", label: "RT Hits (ms)", group: "2-Back Task", color: "#d97706", width: 105, isNumeric: true },
          { key: "nbackHitRate", label: "Hit Rate %", group: "2-Back Task", color: "#d97706", width: 100, isNumeric: true, isPercent: true },
          { key: "nbackFalseAlarmRate", label: "FA Rate %", group: "2-Back Task", color: "#d97706", width: 100, isNumeric: true, isPercent: true, isLastInGroup: true },
          // Corsi
          { key: "corsiMaxSpan", label: "Max Block Span", group: "Corsi Block", color: "#7c3aed", width: 115, isNumeric: true, bold: true, isHighlightPill: true },
          { key: "corsiTotalCorrect", label: "Total Correct", group: "Corsi Block", color: "#7c3aed", width: 105, isNumeric: true, isLastInGroup: true },
          // Digit Span
          { key: "digitSpanMax", label: "Max Digit Span", group: "Digit Span", color: "#0891b2", width: 115, isNumeric: true, bold: true, isHighlightPill: true, isLastInGroup: true },
          // LDT
          { key: "ldtWord", label: "RT Word (ms)", group: "Lexical Decision", color: "#475569", width: 110, isNumeric: true },
          { key: "ldtNonWord", label: "RT Non-Word", group: "Lexical Decision", color: "#475569", width: 110, isNumeric: true },
          { key: "ldtAccuracy", label: "Accuracy %", group: "Lexical Decision", color: "#475569", width: 100, isNumeric: true, isPercent: true, isLastInGroup: true },
          // Negative Priming
          { key: "npControl", label: "RT Ctrl (ms)", group: "Negative Priming", color: "#db2777", width: 105, isNumeric: true },
          { key: "npPrimed", label: "RT Primed", group: "Negative Priming", color: "#db2777", width: 105, isNumeric: true },
          { key: "npEffect", label: "Priming Effect", group: "Negative Priming", color: "#db2777", width: 115, isNumeric: true, bold: true, isHighlightPill: true, isLastInGroup: true },
          // Flanker
          { key: "flankerCongruent", label: "RT Cong (ms)", group: "Flanker Task", color: "#65a30d", width: 110, isNumeric: true },
          { key: "flankerIncongruent", label: "RT Incong", group: "Flanker Task", color: "#65a30d", width: 110, isNumeric: true },
          { key: "flankerEffect", label: "Flanker Effect", group: "Flanker Task", color: "#65a30d", width: 110, isNumeric: true, bold: true, isHighlightPill: true, isLastInGroup: true },
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
            { key: "idNumber", label: "ID Number", width: 115, sticky: true, isId: true },
            { key: "name", label: "Participant Name", width: 155, sticky: true, isName: true },
            { key: "schoolName", label: "School", width: 130 },
            { key: "createdAt", label: "Date", width: 110, isDate: true, isLastInGroup: true },
            { key: "cfsScore", label: "CFS", width: 85, isNumeric: true },
            { key: "gaeneScore", label: "GAENE", width: 85, isNumeric: true },
            { key: "mateScore", label: "MATE", width: 85, isNumeric: true },
            { key: "sbsScore", label: "SBS", width: 85, isNumeric: true },
            { key: "skepScore", label: "SKEP", width: 85, isNumeric: true },
            { key: "tsisSp", label: "TSIS-SP", width: 85, isNumeric: true },
            { key: "tsisSk", label: "TSIS-SK", width: 85, isNumeric: true },
            { key: "tsisSa", label: "TSIS-SA", width: 85, isNumeric: true },
            { key: "ncs6Score", label: "NCS-6", width: 85, isNumeric: true },
            { key: "cfqScore", label: "CFQ", width: 85, isNumeric: true },
            { key: "dass21Depression", label: "DASS-Dep", width: 110, isNumeric: true, badgeKey: "dass21DepressionSeverity" },
            { key: "dass21Anxiety", label: "DASS-Anx", width: 110, isNumeric: true, badgeKey: "dass21AnxietySeverity" },
            { key: "dass21Stress", label: "DASS-Str", width: 110, isNumeric: true, badgeKey: "dass21StressSeverity" },
            { key: "phq9Score", label: "PHQ-9", width: 105, isNumeric: true, badgeKey: "phq9Severity" },
            { key: "gad7Score", label: "GAD-7", width: 105, isNumeric: true, badgeKey: "gad7Severity" },
            { key: "who5Score", label: "WHO-5", width: 105, isNumeric: true, badgeKey: "who5Severity" },
          ]
        };
      } else {
        const qConf = QUESTIONNAIRE_CONFIGS[activeQuestionnaire] || { title: activeQuestionnaire.toUpperCase(), count: 10, description: "", badge: "", color: "#1e40af" };
        const rows = data.individualSheets[activeQuestionnaire] || [];
        
        const qCols: any[] = [
          { key: "idNumber", label: "ID Number", width: 115, sticky: true, isId: true },
          { key: "name", label: "Participant Name", width: 155, sticky: true, isName: true },
          { key: "schoolName", label: "School", width: 130 },
          { key: "createdAt", label: "Date", width: 110, isDate: true, isLastInGroup: true },
        ];

        // Add Q1 to Qn
        for (let i = 1; i <= qConf.count; i++) {
          qCols.push({ key: `q${i}`, label: `Q${i}`, width: 52, isNumeric: true, isAnswerItem: true });
        }

        // Add scores
        if (activeQuestionnaire === "tsis") {
          qCols.push(
            { key: "scoreSp", label: "Score SP", width: 90, isNumeric: true, bold: true },
            { key: "scoreSk", label: "Score SK", width: 90, isNumeric: true, bold: true },
            { key: "scoreSa", label: "Score SA", width: 90, isNumeric: true, bold: true }
          );
        } else if (activeQuestionnaire === "dass21") {
          qCols.push(
            { key: "scoreDepression", label: "Depression", width: 105, isNumeric: true, badgeKey: "severityDepression", bold: true },
            { key: "scoreAnxiety", label: "Anxiety", width: 105, isNumeric: true, badgeKey: "severityAnxiety", bold: true },
            { key: "scoreStress", label: "Stress", width: 105, isNumeric: true, badgeKey: "severityStress", bold: true }
          );
        } else if (["phq9", "gad7", "who5"].includes(activeQuestionnaire)) {
          qCols.push({ key: "score", label: "Final Score", width: 105, isNumeric: true, badgeKey: "severity", bold: true });
        } else {
          qCols.push({ key: "score", label: "Final Score", width: 105, isNumeric: true, bold: true });
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
          { key: "idNumber", label: "ID Number", width: 115, sticky: true, isId: true },
          { key: "name", label: "Participant Name", width: 155, sticky: true, isName: true },
          { key: "age", label: "Age", width: 70, isNumeric: true },
          { key: "gender", label: "Gender", width: 85 },
          { key: "studentClass", label: "Class", width: 80 },
          { key: "schoolName", label: "School / Institution", width: 160 },
          { key: "phoneNo", label: "Phone", width: 120 },
          { key: "consentGiven", label: "Consent", width: 90, badgeKey: "consentGiven" },
          { key: "completed", label: "Status", width: 100, badgeKey: "completed" },
          { key: "cognitiveTestsCount", label: "Cognitive Tasks", width: 115, isNumeric: true },
          { key: "questionnairesAnsweredCount", label: "Surveys Done", width: 105, isNumeric: true },
          { key: "createdAt", label: "Enrolled Date", width: 130, isDate: true },
        ]
      };
    } else {
      return {
        currentRows: data.rawTrials,
        sheetTitle: "Cognitive Raw Trial Logs",
        badgeText: `${data.rawTrials.length} Runs`,
        badgeColor: "#7c3aed",
        columns: [
          { key: "idNumber", label: "ID Number", width: 115, sticky: true, isId: true },
          { key: "name", label: "Participant Name", width: 145, sticky: true, isName: true },
          { key: "specificTest", label: "Test Name", width: 150, bold: true },
          { key: "category", label: "Category", width: 120 },
          { key: "param1Name", label: "Param 1 Name", width: 130 },
          { key: "param1Value", label: "Param 1 Val", width: 100, isNumeric: true },
          { key: "param2Name", label: "Param 2 Name", width: 130 },
          { key: "param2Value", label: "Param 2 Val", width: 100, isNumeric: true },
          { key: "param3Name", label: "Param 3 Name", width: 130 },
          { key: "param3Value", label: "Param 3 Val", width: 100, isNumeric: true },
          { key: "createdAt", label: "Timestamp", width: 130, isDate: true },
        ]
      };
    }
  }, [activeTab, activeQuestionnaire, data]);

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
        padding: isFullScreen ? "12px" : undefined
      }}
    >
      {/* Sleek Compact Executive Top Bar */}
      <div
        className="card"
        style={{
          marginBottom: 10,
          padding: "10px 16px",
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 4px rgba(0,0,0,0.03)"
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          {/* Left Title & Live Metric Badges in 1 Line */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 18 }}>🧠</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", letterSpacing: -0.2 }}>
                Admin Hub
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  backgroundColor: "#ecfdf5",
                  color: "#047857",
                  border: "1px solid #a7f3d0",
                  padding: "1px 6px",
                  borderRadius: 10,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#10b981" }} />
                Live
              </span>
            </div>

            <div style={{ height: 16, width: 1, backgroundColor: "#cbd5e1" }} />

            {/* Quick KPI Inline Badges */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 11 }}>
              <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: 6, color: "#334155", fontWeight: 600 }}>
                👥 <strong>{data.stats.totalParticipants}</strong> Enrolled
              </span>
              <span style={{ background: "#ecfdf5", padding: "2px 8px", borderRadius: 6, color: "#047857", fontWeight: 600 }}>
                ✅ <strong>{data.stats.completedSessions}</strong> Done
              </span>
              <span style={{ background: "#eff6ff", padding: "2px 8px", borderRadius: 6, color: "#1e40af", fontWeight: 600 }}>
                ⚡ <strong>{data.stats.totalCognitiveTests}</strong> Cognitive
              </span>
              <span style={{ background: "#faf5ff", padding: "2px 8px", borderRadius: 6, color: "#6b21a8", fontWeight: 600 }}>
                📋 <strong>{data.stats.totalQuestionnaireAnswers}</strong> Surveys
              </span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn btn-outline"
              style={{ padding: "5px 10px", fontSize: 11, borderRadius: 6 }}
              title="Pull newest records from PostgreSQL"
            >
              <span style={{ transform: isRefreshing ? "rotate(180deg)" : "none", transition: "transform 0.5s" }}>🔄</span>
              {isRefreshing ? "..." : "Refresh"}
            </button>

            <a
              href="/api/admin/export-data"
              className="btn btn-outline"
              style={{ padding: "5px 10px", fontSize: 11, borderRadius: 6 }}
              download
              title="Download 12-sheet Questionnaires Excel (.xlsx)"
            >
              <span>📥</span> Survey (.xlsx)
            </a>

            <a
              href="/api/admin/export-cognitive-data"
              className="btn btn-outline"
              style={{ padding: "5px 10px", fontSize: 11, borderRadius: 6, borderColor: "#a7f3d0", color: "#047857", backgroundColor: "#f0fdf4" }}
              download
              title="Download Cognitive Metrics Battery Excel (.xlsx)"
            >
              <span>📥</span> Cognitive (.xlsx)
            </a>

            <button
              onClick={handleSyncGoogleSheets}
              disabled={syncStatus === "loading"}
              className="btn"
              style={{
                padding: "5px 10px",
                fontSize: 11,
                borderRadius: 6,
                backgroundColor: syncStatus === "success" ? "#10b981" : "#1e40af",
              }}
              title="Send batch sync to connected Google Sheets"
            >
              <span>☁️</span>
              {syncStatus === "loading" ? "Syncing..." : syncStatus === "success" ? "Synced!" : "Sync Sheets"}
            </button>
          </div>
        </div>

        {/* Sync Status Alert */}
        {syncStatus !== "idle" && (
          <div
            style={{
              marginTop: 6,
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: syncStatus === "success" ? "#ecfdf5" : syncStatus === "error" ? "#fef2f2" : "#eff6ff",
              color: syncStatus === "success" ? "#065f46" : syncStatus === "error" ? "#991b1b" : "#1e40af",
              border: `1px solid ${syncStatus === "success" ? "#a7f3d0" : syncStatus === "error" ? "#fecaca" : "#bfdbfe"}`
            }}
          >
            <span>{syncMessage}</span>
            <button
              onClick={() => setSyncStatus("idle")}
              style={{ background: "none", border: "none", cursor: "pointer", fontWeight: "bold" }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Main Unified Table Card */}
      <div className="card" style={{ padding: "0px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
        {/* Unified Tab Bar + Toolbar in One Compact Strip */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#f8fafc",
            borderBottom: "1px solid #cbd5e1",
            padding: "4px 10px 0 10px",
            gap: 8
          }}
        >
          {/* Tab Buttons */}
          <div style={{ display: "flex", gap: 2, overflowX: "auto" }}>
            <button
              onClick={() => setActiveTab("cognitive")}
              style={{
                padding: "8px 14px",
                border: "none",
                borderBottom: activeTab === "cognitive" ? "2px solid #1e40af" : "2px solid transparent",
                backgroundColor: activeTab === "cognitive" ? "#ffffff" : "transparent",
                color: activeTab === "cognitive" ? "#1e40af" : "#64748b",
                fontWeight: activeTab === "cognitive" ? 700 : 500,
                fontSize: 12,
                cursor: "pointer",
                borderRadius: "6px 6px 0 0",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>🧠</span> Cognitive Matrix
              <span style={{ fontSize: 10, background: "#e2e8f0", padding: "0 5px", borderRadius: 8, color: "#1e293b", fontWeight: 700 }}>
                {data.cognitiveRows.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("questionnaires")}
              style={{
                padding: "8px 14px",
                border: "none",
                borderBottom: activeTab === "questionnaires" ? "2px solid #1e40af" : "2px solid transparent",
                backgroundColor: activeTab === "questionnaires" ? "#ffffff" : "transparent",
                color: activeTab === "questionnaires" ? "#1e40af" : "#64748b",
                fontWeight: activeTab === "questionnaires" ? 700 : 500,
                fontSize: 12,
                cursor: "pointer",
                borderRadius: "6px 6px 0 0",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>📋</span> Questionnaires
              <span style={{ fontSize: 10, background: "#e2e8f0", padding: "0 5px", borderRadius: 8, color: "#1e293b", fontWeight: 700 }}>
                12
              </span>
            </button>

            <button
              onClick={() => setActiveTab("participants")}
              style={{
                padding: "8px 14px",
                border: "none",
                borderBottom: activeTab === "participants" ? "2px solid #1e40af" : "2px solid transparent",
                backgroundColor: activeTab === "participants" ? "#ffffff" : "transparent",
                color: activeTab === "participants" ? "#1e40af" : "#64748b",
                fontWeight: activeTab === "participants" ? 700 : 500,
                fontSize: 12,
                cursor: "pointer",
                borderRadius: "6px 6px 0 0",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>👥</span> Directory
              <span style={{ fontSize: 10, background: "#e2e8f0", padding: "0 5px", borderRadius: 8, color: "#1e293b", fontWeight: 700 }}>
                {data.participants.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("raw")}
              style={{
                padding: "8px 14px",
                border: "none",
                borderBottom: activeTab === "raw" ? "2px solid #1e40af" : "2px solid transparent",
                backgroundColor: activeTab === "raw" ? "#ffffff" : "transparent",
                color: activeTab === "raw" ? "#1e40af" : "#64748b",
                fontWeight: activeTab === "raw" ? 700 : 500,
                fontSize: 12,
                cursor: "pointer",
                borderRadius: "6px 6px 0 0",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>🔬</span> Raw Trials
              <span style={{ fontSize: 10, background: "#e2e8f0", padding: "0 5px", borderRadius: 8, color: "#1e293b", fontWeight: 700 }}>
                {data.rawTrials.length}
              </span>
            </button>
          </div>

          {/* Quick Toolbar (Right) */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", paddingBottom: 4 }}>
            {/* Filter Preset Pills */}
            <div style={{ display: "flex", backgroundColor: "#e2e8f0", padding: 2, borderRadius: 6, gap: 1 }}>
              <button
                onClick={() => setFilterPreset("all")}
                style={{
                  padding: "3px 6px",
                  border: "none",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                  backgroundColor: filterPreset === "all" ? "white" : "transparent",
                  color: filterPreset === "all" ? "#0f172a" : "#64748b",
                }}
              >
                All ({currentRows.length})
              </button>
              <button
                onClick={() => setFilterPreset("completed")}
                style={{
                  padding: "3px 6px",
                  border: "none",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                  backgroundColor: filterPreset === "completed" ? "white" : "transparent",
                  color: filterPreset === "completed" ? "#059669" : "#64748b",
                }}
              >
                Completed
              </button>
              <button
                onClick={() => setFilterPreset("severe")}
                style={{
                  padding: "3px 6px",
                  border: "none",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                  backgroundColor: filterPreset === "severe" ? "white" : "transparent",
                  color: filterPreset === "severe" ? "#dc2626" : "#64748b",
                }}
              >
                Severe
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "4px 8px 4px 22px",
                  fontSize: 11,
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  width: 140,
                  outline: "none",
                  height: 26
                }}
              />
              <span style={{ position: "absolute", left: 6, top: 4, fontSize: 10, color: "#94a3b8" }}>🔍</span>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  style={{ position: "absolute", right: 6, top: 3, border: "none", background: "none", color: "#94a3b8", cursor: "pointer", fontSize: 10 }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Density Toggle */}
            <button
              onClick={() => setDensity(d => d === "compact" ? "comfortable" : "compact")}
              className="btn btn-outline"
              style={{ padding: "4px 7px", fontSize: 11, borderRadius: 6, height: 26 }}
              title="Toggle Compact/Comfortable row height"
            >
              {density === "compact" ? "📏 Compact" : "📐 Spaced"}
            </button>

            {/* Stats Toggle */}
            <button
              onClick={() => setShowStatsBar(s => !s)}
              className="btn btn-outline"
              style={{ padding: "4px 7px", fontSize: 11, borderRadius: 6, height: 26 }}
              title="Toggle summary metrics"
            >
              📊 Stats
            </button>

            {/* Copy TSV */}
            <button
              onClick={handleCopyTSV}
              className="btn btn-outline"
              style={{ padding: "4px 8px", fontSize: 11, borderRadius: 6, height: 26 }}
              title="Copy active sheet for Excel"
            >
              <span>📋</span> {copyFeedback ? "Copied!" : "Copy"}
            </button>

            {/* Download CSV */}
            <button
              onClick={handleDownloadCSV}
              className="btn btn-outline"
              style={{ padding: "4px 8px", fontSize: 11, borderRadius: 6, height: 26 }}
              title="Download CSV"
            >
              <span>💾</span> CSV
            </button>

            {/* Full Screen Toggle */}
            <button
              onClick={() => setIsFullScreen(f => !f)}
              className="btn btn-outline"
              style={{ padding: "4px 7px", fontSize: 11, borderRadius: 6, height: 26 }}
              title="Fullscreen"
            >
              {isFullScreen ? "🗗" : "⛶"}
            </button>

            {/* Rows Per Page */}
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                padding: "2px 4px",
                fontSize: 11,
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                backgroundColor: "white",
                color: "#334155",
                outline: "none",
                cursor: "pointer",
                height: 26
              }}
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={-1}>All</option>
            </select>
          </div>
        </div>

        {/* Sub-Bar: Quick Task Jump (Cognitive) OR Questionnaire Sheet Chips */}
        {activeTab === "cognitive" ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "5px 10px",
              backgroundColor: "#ffffff",
              borderBottom: "1px solid #e2e8f0",
              overflowX: "auto"
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", whiteSpace: "nowrap", marginRight: 4 }}>
              🎯 Jump:
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
                  padding: "2px 6px",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  whiteSpace: "nowrap",
                  transition: "all 0.1s"
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
              gap: 4,
              padding: "5px 10px",
              backgroundColor: "#ffffff",
              borderBottom: "1px solid #e2e8f0",
              alignItems: "center"
            }}
          >
            <button
              onClick={() => setActiveQuestionnaire("overview")}
              style={{
                padding: "3px 8px",
                fontSize: 11,
                borderRadius: 4,
                border: activeQuestionnaire === "overview" ? "1px solid #1e40af" : "1px solid #cbd5e1",
                backgroundColor: activeQuestionnaire === "overview" ? "#1e40af" : "#ffffff",
                color: activeQuestionnaire === "overview" ? "#ffffff" : "#334155",
                fontWeight: activeQuestionnaire === "overview" ? 700 : 500,
                cursor: "pointer"
              }}
            >
              ⭐ Overview
            </button>

            {Object.entries(QUESTIONNAIRE_CONFIGS).map(([id, conf]) => {
              const isSelected = activeQuestionnaire === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveQuestionnaire(id)}
                  style={{
                    padding: "3px 6px",
                    fontSize: 10,
                    borderRadius: 4,
                    border: isSelected ? `1px solid ${conf.color}` : "1px solid #cbd5e1",
                    backgroundColor: isSelected ? conf.color : "#ffffff",
                    color: isSelected ? "#ffffff" : "#334155",
                    fontWeight: isSelected ? 700 : 500,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 3
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
            style={{
              display: "flex",
              gap: 6,
              padding: "4px 10px",
              backgroundColor: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
              overflowX: "auto",
              fontSize: 10,
              alignItems: "center"
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

        {/* Data Grid Table Wrapper */}
        <div
          ref={tableWrapperRef}
          className="sheet-table-wrapper"
          style={{
            width: "100%",
            overflowX: "auto",
            maxHeight: isFullScreen ? "86vh" : "75vh",
            overflowY: "auto",
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
              fontSize: density === "compact" ? 12 : 13,
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
                        textAlign: "center",
                        fontSize: 11,
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
              <tr style={{ position: "sticky", top: groupHeaders ? 29 : 0, zIndex: 19 }}>
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
                        padding: density === "compact" ? "6px 8px" : "8px 10px",
                        textAlign: col.isNumeric ? "right" : "left",
                        fontSize: density === "compact" ? 11 : 12,
                        fontWeight: 700,
                        borderBottom: "2px solid #cbd5e1",
                        borderRight: isLastCol ? "2px solid #94a3b8" : "1px solid #e2e8f0",
                        width: col.width,
                        minWidth: col.width,
                        cursor: "pointer",
                        userSelect: "none",
                        position: col.sticky ? "sticky" : "static",
                        left: col.sticky ? (idx === 0 ? 0 : columns[0].width) : undefined,
                        zIndex: col.sticky ? 25 : undefined,
                        boxShadow: col.sticky && idx === 1 ? "3px 0 6px -2px rgba(0,0,0,0.12)" : undefined,
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
                              padding: density === "compact" ? "5px 8px" : "8px 10px",
                              textAlign: col.isNumeric ? "right" : "left",
                              borderBottom: "1px solid #e2e8f0",
                              borderRight: isLastCol ? "2px solid #cbd5e1" : "1px solid #f1f5f9",
                              fontSize: density === "compact" ? 11 : 12,
                              fontVariantNumeric: "tabular-nums",
                              fontWeight: col.bold ? 700 : 400,
                              color: col.bold ? "#0f172a" : "#334155",
                              position: col.sticky ? "sticky" : "static",
                              left: col.sticky ? (cIdx === 0 ? 0 : columns[0].width) : undefined,
                              backgroundColor: col.sticky ? (isEven ? "#ffffff" : "#f8fafc") : "inherit",
                              zIndex: col.sticky ? 10 : undefined,
                              boxShadow: col.sticky && cIdx === 1 ? "3px 0 6px -2px rgba(0,0,0,0.1)" : undefined,
                            }}
                          >
                            {col.badgeKey ? (
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
        <div style={{ padding: "8px 12px", borderTop: "1px solid #e2e8f0", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10, fontSize: 11, color: "#64748b" }}>
          <div>
            Showing <strong>{paginatedRows.length}</strong> of <strong>{totalRowsCount}</strong> entries
            {searchTerm && ` (filtered)`}
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="btn btn-outline"
                style={{ padding: "3px 6px", fontSize: 10 }}
              >
                ⏮ First
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn btn-outline"
                style={{ padding: "3px 6px", fontSize: 10 }}
              >
                ◀ Prev
              </button>
              <span style={{ padding: "0 6px", fontWeight: 600, color: "#0f172a" }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-outline"
                style={{ padding: "3px 6px", fontSize: 10 }}
              >
                Next ▶
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="btn btn-outline"
                style={{ padding: "3px 6px", fontSize: 10 }}
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
            alignItems: "center",
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => setSelectedParticipantId(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: 860,
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "24px 28px",
              backgroundColor: "white",
              borderRadius: 12,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dossier Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #e2e8f0", paddingBottom: 16, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1e40af", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Clinical & Cognitive Dossier
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: "2px 0 0 0", color: "#0f172a" }}>
                  {selectedParticipant.name} ({selectedParticipant.idNumber || "No ID"})
                </h2>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  Session ID: <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>{selectedParticipant.sessionId}</code>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={() => window.print()}
                  className="btn btn-outline"
                  style={{ padding: "6px 12px", fontSize: 12 }}
                  title="Print participant dossier"
                >
                  🖨️ Print
                </button>
                <button
                  onClick={() => setSelectedParticipantId(null)}
                  style={{
                    border: "none",
                    background: "#f1f5f9",
                    borderRadius: "50%",
                    width: 32,
                    height: 32,
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 18, backgroundColor: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
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
            <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", gap: 8, marginBottom: 16 }}>
              <button
                onClick={() => setDossierTab("clinical")}
                style={{
                  padding: "8px 14px",
                  border: "none",
                  borderBottom: dossierTab === "clinical" ? "2px solid #1e40af" : "2px solid transparent",
                  backgroundColor: "transparent",
                  color: dossierTab === "clinical" ? "#1e40af" : "#64748b",
                  fontWeight: dossierTab === "clinical" ? 700 : 500,
                  fontSize: 13,
                  cursor: "pointer"
                }}
              >
                📋 Clinical Scales
              </button>
              <button
                onClick={() => setDossierTab("cognitive")}
                style={{
                  padding: "8px 14px",
                  border: "none",
                  borderBottom: dossierTab === "cognitive" ? "2px solid #1e40af" : "2px solid transparent",
                  backgroundColor: "transparent",
                  color: dossierTab === "cognitive" ? "#1e40af" : "#64748b",
                  fontWeight: dossierTab === "cognitive" ? 700 : 500,
                  fontSize: 13,
                  cursor: "pointer"
                }}
              >
                🧠 Cognitive Battery
              </button>
              <button
                onClick={() => setDossierTab("raw")}
                style={{
                  padding: "8px 14px",
                  border: "none",
                  borderBottom: dossierTab === "raw" ? "2px solid #1e40af" : "2px solid transparent",
                  backgroundColor: "transparent",
                  color: dossierTab === "raw" ? "#1e40af" : "#64748b",
                  fontWeight: dossierTab === "raw" ? 700 : 500,
                  fontSize: 13,
                  cursor: "pointer"
                }}
              >
                🔬 Raw Trial Logs ({selectedParticipantRawTrials.length})
              </button>
            </div>

            {/* Clinical Tab Content */}
            {dossierTab === "clinical" && selectedParticipantQuestionnaires && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
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
                    padding: "6px 12px",
                    fontSize: 12,
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    width: 240,
                    outline: "none",
                  }}
                />
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
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button
                onClick={() => setSelectedParticipantId(null)}
                className="btn"
                style={{ padding: "8px 20px" }}
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
