# COPYRIGHT REGISTRATION SPECIFICATION & TECHNICAL ABSTRACT
## Class of Work: Literary Work — Computer Software / Programme
### Under The Copyright Act, 1957 (Rule 70) / International Copyright Frameworks (WIPO)

---

## 1. GENERAL METADATA & OWNERSHIP PARTICULARS

| Parameter | Specification |
| :--- | :--- |
| **Title of the Work** | **NeuroCogniLab: High-Precision Neurocognitive Testing & Psychometric Assessment Battery** |
| **Alternative / Working Title** | AIIMS Kalyani Physiology Cognitive Lab Assessment System (`neurocognilab`) |
| **Nature / Category of Work** | Computer Software / Programme (Literary Work under Section 2(o) of the Copyright Act, 1957) |
| **Author / Lead Software Architect** | **Rutuj Kharatmol** |
| **Nationality** | Indian |
| **Institutional Affiliation** | Department of Physiology, All India Institute of Medical Sciences (AIIMS), Kalyani, West Bengal, India |
| **Year of Creation / Completion** | 2024 – 2026 |
| **Country of First Publication** | India |
| **Digital Provenance Token ID** | `RK-AIIMS-COG-7734` |
| **Canonical Provenance SHA-256** | `82570bd93e92ad0c0fc7defa1e67646beca3e64f019a756c6100df984e55da82` |
| **Cryptographic System Origin Tag** | `RK-NEUROCOGNILAB-AIIMS-2026` |
| **Operating Environment / Platforms** | Cross-platform Web, Progressive Web Application (PWA), Desktop, Tablet, Mobile |

---

## 2. FORMAL ABSTRACT OF THE COMPUTER SOFTWARE
*(Designed for direct insertion into Form XIV / Statement of Particulars / Patent & Copyright Office Filings)*

> **Abstract:**  
> **NeuroCogniLab** is an original, integrated full-stack neurocognitive evaluation and clinical psychometric software suite engineered to deliver millisecond-precision psychological experimentation, automated clinical metric extraction, and multi-redundant telemetry synchronization across clinical, laboratory, and field research environments. 
>
> Developed specifically for neurocognitive and behavioral physiology research at AIIMS Kalyani, the software implements nine (9) standardized computerized cognitive tasks (including the Stroop Task, N-Back Working Memory, Corsi Block-Tapping, Digit Span, Sustained Attention to Response Task [SART], Dot Probe, Eriksen Flanker, Lexical Decision Task [LDT], and Negative Priming) alongside twelve (12) validated psychometric and mental health assessment instruments (including CFS, GAENE, MATE, SBS, SKEP, TSIS, NCS-6, CFQ, DASS-21, PHQ-9, GAD-7, and WHO-5) featuring full dual-language (English and Bengali) localization.
>
> The software features an original millisecond-precision reaction-time measurement engine utilizing browser `performance.now()` APIs decoupled from UI rendering cycles, an offline-first transactional queueing engine with idempotent optimistic session remapping for internet-disrupted environments, and a dual-pipeline data persistence architecture synchronizing normalized schemas to both an enterprise relational database (PostgreSQL via Prisma ORM) and live remote spreadsheets via webhook automation. The codebase embeds a multi-layered forensic authorship verification subsystem, incorporating zero-width Unicode steganography, salted XOR-encrypted manifest decoding, and standalone synchronous pure-TypeScript SHA-256 cryptographic verification for tamper evidence and intellectual property protection.

---

## 3. OBJECTIVE AND INDUSTRIAL/CLINICAL APPLICABILITY

1. **Precision Cognitive Telemetry:** Overcoming traditional web application timing inaccuracies through hardware-clock synchronization (`performance.now()`), capturing reaction times (RT), stimulus latencies, omission/commission errors, and attentional bias indices with sub-millisecond precision.
2. **Scalable Multi-Tenant Field Deployment:** Enabling high-throughput, concurrent psychological testing across classrooms, clinical wards, and field cohorts without data collision, supported by database-level unique constraints and conflict-free intake routing.
3. **Dual-Language Accessibility:** Providing localized psychometric questionnaires in English and Bengali to eliminate linguistic barriers in cognitive self-assessment within diverse demographics.
4. **Offline Resilience in Remote Settings:** Providing continuous testing capabilities through client-side transactional request queuing, dead-letter recovery, and automatic replay upon network recovery.
5. **Forensic Intellectual Property & Data Provenance:** Embedding tamper-evident cryptographic and steganographic watermarks within the compiled software binaries and runtime endpoints to legally ensure code integrity and unalterable authorship attribution.

---

## 4. DETAILED ARCHITECTURAL & FUNCTIONAL MODULES

### Module A: High-Precision Cognitive Experimentation Engine
The cognitive subsystem comprises nine (9) computationally rigorous paradigms with counterbalanced randomized trials, stimulus-fixation scheduling, and real-time response telemetry:
1. **Stroop Color-Word Task:** Evaluates selective attention, cognitive flexibility, and executive inhibition by measuring congruent vs. incongruent interference latencies (Stroop Effect).
2. **N-Back Task (2-Back):** Quantifies working memory updating, stimulus monitoring, hit rates, false alarm rates, and signal detection discriminability ($d'$).
3. **Corsi Block-Tapping Task:** Computes visuospatial short-term and working memory span through progressive spatial sequence reproduction.
4. **Digit Span Task:** Determines verbal/auditory numerical working memory capacity via forward and backward digit sequence recall.
5. **Sustained Attention to Response Task (SART):** Measures vigilance, sustained attention, and response inhibition by tracking commission errors (no-go failures) and reaction time variability.
6. **Dot Probe Task:** Evaluates selective attentional bias and threat monitoring through randomized paired spatial stimuli presentation and target localization latencies.
7. **Eriksen Flanker Task:** Assesses selective visual attention and conflict resolution under directional flanker interference.
8. **Lexical Decision Task (LDT):** Quantifies semantic processing speeds and lexical retrieval accuracy for words versus non-words.
9. **Negative Priming Task:** Assesses cognitive inhibitory mechanisms by measuring response suppression to previously ignored distractor stimuli.

### Module B: Psychometric & Clinical Assessment Suite
A comprehensive battery of twelve (12) psychometric instruments with standardized scoring engines (Sum, Mean, Subscale scoring) and bilingual item presentations:
1. **Cognitive Flexibility Scale (CFS):** 12 items evaluating awareness of communication alternatives and willingness to adapt.
2. **Generalized Acceptance of EvolutioN Evaluation (GAENE):** 13 items measuring scientific epistemology and acceptance.
3. **Measure of Acceptance of the Theory of Evolution (MATE):** 20 items assessing biological and evolutionary understanding.
4. **Supernatural Belief Scale (SBS):** 10 items assessing spiritual and metaphysical belief dimensions.
5. **Skepticism Towards Advertisements (SKEP):** 9 items evaluating critical cognitive filtering and consumer skepticism.
6. **Tromsø Social Intelligence Scale (TSIS):** 21 items measuring Social Information Processing (SP), Social Skills (SK), and Social Awareness (SA).
7. **Need for Cognition Scale (NCS-6):** 6 items evaluating intrinsic motivation to engage in effortful cognitive endeavors.
8. **Cognitive Failures Questionnaire (CFQ):** 10 items assessing everyday perception, memory, and motor slip frequencies.
9. **Depression, Anxiety, and Stress Scales (DASS-21):** 21 items stratifying emotional distress into tripartite clinical domains.
10. **Patient Health Questionnaire (PHQ-9):** 9 items measuring depressive episode severity and somatic symptoms.
11. **Generalized Anxiety Disorder Scale (GAD-7):** 7 items screening for generalized anxiety severity.
12. **WHO-5 Well-Being Index:** 5 items measuring positive psychological well-being and vitality.

### Module C: Offline-First Synchronous Queuing Engine (`offlineSync.ts`)
- **Optimistic Offline Session Generation:** Generates temporary client-side session tokens (`offline-*`) stored in resilient browser storage.
- **Ordered Replay Queue:** Categorizes requests into atomic "signup" and subsequent "submission" records, ensuring session identity resolution occurs prior to dependent score submissions.
- **Idempotent ID Remapping:** Intercepts outgoing requests upon online reconnection, replacing temporary offline IDs with verified server-minted UUIDs.
- **Dead-Letter Resiliency:** Automatically captures, stores, and segregates failed requests without disrupting active participant testing.

### Module D: Dual-Pipeline Data Ingestion & Administrative Intelligence
- **Relational Data Tier:** Engineered on PostgreSQL with Prisma ORM, utilizing single-round-trip optimized raw SQL aggregation (`UNION ALL` submission queries with sub-query JSON aggregation) to eliminate connection-pool bottlenecks.
- **Real-Time Live Webhook Synchronization:** Dispatches asynchronous HTTP payloads to Google Apps Script / Google Sheets endpoints for redundant, live monitoring.
- **Administrative Command Center:** Secure role-based administrative dashboard protected via Bcrypt and NextAuth, supporting direct spreadsheet exports, cohort analytics, and raw trial telemetry extraction via ExcelJS.

### Module E: Proprietary Provenance & Cryptographic Watermarking Subsystem
- **Zero-Width Steganographic Signature:** Implements invisible Unicode zero-width sequence (`\u200B`, `\u200C`, `\u200D`) encoding the author's identity directly into binary assets.
- **Salted XOR Codec:** Obfuscates proprietary manifest JSON using a cryptographic salt key (`RK_NEUROCOGNILAB_AIIMS_2026`).
- **Synchronous Pure-TypeScript SHA-256 Engine:** In-memory, dependency-free SHA-256 hash algorithm executing consistently across browser, serverless, and Node.js environments.
- **Forensic Verification Endpoint & CLI:** Exposes an authenticated runtime verification route (`/api/provenance`) returning custom tamper-detection HTTP headers (`X-System-Origin`, `X-Author-Checksum`) and a standalone forensic CLI (`scripts/verify-provenance.js`) for copyright enforcement.

---

## 5. TECHNICAL SPECIFICATIONS & PROGRAMMING STACK

- **Primary Programming Languages:** TypeScript (100% strict type safety), JavaScript (ES2022+), SQL (PostgreSQL dialect).
- **Frontend Architecture:** Next.js (App Router), React 18, Custom Glassmorphic CSS Design System, Responsive Progressive Web App (PWA).
- **Backend & Serverless Layer:** Next.js Serverless Route Handlers, Node.js runtime.
- **Database & Object-Relational Mapping:** PostgreSQL, Prisma ORM (Client v5.0+), Raw Aggregated SQL.
- **Third-Party Open Source Components:** `bcrypt`, `exceljs`, `google-spreadsheet`, `@ducanh2912/next-pwa`, `@prisma/client`.
- **Hardware & System Requirements:**
  - *Client Devices:* Any modern browser supporting ECMAScript 6 and W3C High Resolution Time API (Chrome, Edge, Safari, Firefox) on Android, iOS, Windows, macOS, Linux.
  - *Server Environment:* Node.js 18.x or higher, PostgreSQL 14+, HTTPS-enabled hosting environment.

---

## 6. STATEMENT OF NOVELTY & ORIGINALITY

The author, **Rutuj Kharatmol**, asserts original authorship in the architecture, implementation, algorithmic logic, user-interface composition, and source code of the **NeuroCogniLab** software application. Specifically, the following elements constitute original intellectual creations:
1. The unique design, sequencing, and algorithmic orchestration combining nine distinct neurocognitive paradigms with twelve clinical psychometric scales in a unified web-native architecture.
2. The proprietary offline transaction queuing engine with dynamic session ID remapping designed specifically for psychological experiments in low-connectivity areas.
3. The custom single-roundtrip multi-table SQL aggregation pipeline minimizing latency over high-latency serverless database connections.
4. The multi-tiered tamper-evident cryptographic provenance system combining zero-width steganography and pure-TypeScript synchronous SHA-256 validation.
5. The original Bengali translation and localization matrix integrated into the standardized clinical psychometric instruments.

---

## 7. DECLARATION OF NON-INFRINGEMENT & THIRD-PARTY RIGHTS

The source code constitutes an original literary work created through independent intellectual effort by the author. Standard open-source frameworks and libraries (such as React, Next.js, and Prisma) have been utilized strictly in accordance with their respective MIT/Apache licenses and have not been plagiarized, misappropriated, or derived from any proprietary third-party software.

---

**Certified and Documented by:**  
**Rutuj Kharatmol**  
*Lead Software Architect & Creator*  
*Department of Physiology, AIIMS Kalyani*  
*Digital Provenance Token: `RK-AIIMS-COG-7734`*
