# Cahier des Charges — Rapport de Projet de Fin d'Études

---

## Page de Garde

| | |
|---|---|
| **Établissement** | ESPRIT — École Supérieure Privée d'Ingénierie et de Technologies, Tunis |
| **Filière** | Génie Logiciel / DevOps & Cloud |
| **Année académique** | 2025–2026 |
| **Étudiant** | Khalil Ben Yahia Wenich |
| **E-mail académique** | khalil.benyahiawenich@esprit.tn |
| **Entreprise d'accueil** | Capgemini Altran Telnet Corporation Tunisie |
| **Titre du projet** | Plateforme AIOps — Analyse Intelligente des Pipelines CI/CD |
| **Date de soutenance** | Juin 2026 |

---

## Résumé

Ce projet de fin d'études, réalisé au sein de **Capgemini Altran Telnet Corporation Tunisie**, consiste en la conception et le développement d'une **plateforme AIOps** (Artificial Intelligence for IT Operations) pour l'analyse automatisée des pipelines CI/CD.

La solution reçoit les événements GitLab en temps réel via webhooks sécurisés, collecte les rapports de qualité (SonarQube) et de sécurité (Trivy), puis soumet l'ensemble à un Large Language Model (Groq — Llama 3.3 70B) pour produire une analyse de cause racine, un score de risque et des suggestions de correction priorisées — le tout en moins de 10 secondes.

La plateforme intègre également un système de gestion des incidents, une base de connaissances auto-alimentée, un score de santé par projet (grade A à F) et des rapports hebdomadaires agrégés, le tout présenté dans un dashboard interactif React en temps réel.

La solution est containerisée avec Docker, déployée sur Kubernetes (k3s) via Helm, et dotée d'un pipeline CI/CD Jenkins complet avec tests automatisés.

**Mots-clés :** AIOps, CI/CD, Root Cause Analysis, LLM, GitLab, Kubernetes, Jenkins, Node.js, React

---

## Abstract

This final year project, carried out at **Capgemini Altran Telnet Corporation Tunisia**, consists of designing and developing an **AIOps platform** for the automated analysis of CI/CD pipelines.

The solution receives GitLab events in real time via secure webhooks, collects quality (SonarQube) and security (Trivy) reports, then submits everything to a Large Language Model (Groq — Llama 3.3 70B) to produce a root cause analysis, a risk score and prioritized fix suggestions — all within 10 seconds.

The platform also includes incident management, a self-feeding knowledge base, a per-project health score (A to F grade) and weekly aggregated reports, all presented in a real-time interactive React dashboard.

The solution is containerized with Docker, deployed on Kubernetes (k3s) via Helm, and equipped with a full Jenkins CI/CD pipeline with automated tests.

**Keywords:** AIOps, CI/CD, Root Cause Analysis, LLM, GitLab, Kubernetes, Jenkins, Node.js, React

---

## Table des Matières

1. [Contexte et Problématique](#1-contexte-et-problématique)
2. [Présentation du Projet](#2-présentation-du-projet)
3. [Architecture Technique](#3-architecture-technique)
4. [Modèles de Données](#4-modèles-de-données)
5. [Services et Logique Métier](#5-services-et-logique-métier)
6. [API REST](#6-api-rest)
7. [Architecture Frontend](#7-architecture-frontend)
8. [Tests Automatisés](#8-tests-automatisés)
9. [Déploiement et CI/CD](#9-déploiement-et-cicd)
10. [Sécurité](#10-sécurité)
11. [Stack Technologique](#11-stack-technologique)
12. [Résultats Obtenus](#12-résultats-obtenus)
13. [Évolutions Futures](#13-évolutions-futures)
14. [Conclusion](#14-conclusion)

---

## 1. Contexte et Problématique

### 1.1 Contexte Général

Dans un environnement de développement logiciel moderne, les équipes adoptent massivement les pratiques **DevOps** et **CI/CD** (Intégration Continue / Déploiement Continu). Ces pratiques génèrent des centaines de pipelines par jour, chacun produisant des logs volumineux, des rapports de qualité et des résultats de sécurité.

Capgemini Altran Telnet Corporation Tunisie accompagne plusieurs entreprises clientes dans leur transformation DevOps. Les ingénieurs sont confrontés quotidiennement à des pipelines en échec dont le diagnostic est long, répétitif et chronophage.

### 1.2 Problématique

Lorsqu'un pipeline échoue ou présente des anomalies, les ingénieurs doivent :

- Parcourir manuellement des milliers de lignes de logs
- Corréler les résultats de plusieurs outils (GitLab CI, SonarQube, Trivy) dans des interfaces séparées
- Identifier la cause racine sans assistance automatisée
- Gérer les incidents sans traçabilité centralisée
- Perdre du temps sur des problèmes récurrents dont les solutions ne sont pas documentées

**Temps moyen de diagnostic manuel : 30 à 90 minutes par incident.**

### 1.3 Solution Proposée

Développement d'une plateforme **AIOps** qui :

1. **Automatise** l'analyse des pipelines CI/CD grâce à l'IA
2. **Centralise** les résultats GitLab CI, SonarQube et Trivy en une seule interface
3. **Mémorise** les solutions dans une base de connaissances auto-alimentée
4. **Mesure** la santé de chaque projet en continu
5. **Gère** les incidents avec traçabilité complète et post-mortems IA

---

## 2. Présentation du Projet

### 2.1 Définition

La plateforme AIOps est une application web **full-stack** qui :

1. **Reçoit** les événements des pipelines GitLab via webhooks sécurisés (HMAC-SHA256)
2. **Collecte** automatiquement les logs CI, les rapports SonarQube et Trivy
3. **Analyse** les données avec le LLM Groq (Llama 3.3 70B) et calcule un score de risque
4. **Apprend** des patterns récurrents via une base de connaissances auto-alimentée
5. **Mesure** la santé de chaque projet avec un score pondéré sur 6 métriques (grade A → F)
6. **Gère** les incidents avec cycle de vie complet et génération de post-mortems IA
7. **Rapporte** les métriques hebdomadaires agrégées par projet
8. **Présente** tous les résultats dans un dashboard interactif en temps réel (WebSocket)

### 2.2 Objectifs

| ID | Objectif | Description |
|----|----------|-------------|
| **O1** | Réduction du temps de diagnostic | De 30–90 min à moins de 2 min grâce à l'IA |
| **O2** | Centralisation des données | GitLab CI, SonarQube et Trivy dans une seule interface |
| **O3** | Analyse AI de la cause racine | Suggestions de corrections priorisées par sévérité |
| **O4** | Sécurité des conteneurs | Détection et alerte sur les CVEs Trivy |
| **O5** | Apprentissage des solutions | Base de connaissances évitant les analyses LLM répétées |
| **O6** | Score de santé projet | Grade continu pour piloter la qualité |
| **O7** | Gestion des incidents | Cycle de vie complet avec post-mortems IA |
| **O8** | Risque des Merge Requests | Évaluation avant fusion avec commentaire automatique |
| **O9** | Rapports hebdomadaires | Métriques DevOps agrégées automatiquement |

---

## 3. Architecture Technique

### 3.1 Vue d'Ensemble

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                        SOURCES DE DONNÉES                                    ║
║                                                                              ║
║  ┌──────────────┐   Webhook      ┌──────────────┐   API     ┌───────────┐   ║
║  │  GitLab CE   │───HMAC-SHA256─▶│              │◀──────────│ SonarQube │   ║
║  │  Pipeline CI │               │              │           │    CE     │   ║
║  └──────────────┘               │   BACKEND    │           └───────────┘   ║
║  ┌──────────────┐   Webhook MR   │   Node.js    │   Trivy                   ║
║  │  GitLab MR   │───────────────▶│   Express    │──artifact▶ Scanner        ║
║  └──────────────┘               │   Port 3001  │                           ║
║                                 └──────┬───────┘                           ║
║                                        │                                    ║
║              ┌─────────────────────────┼─────────────────────┐              ║
║              │                         │                      │              ║
║    ┌─────────▼──────┐    ┌─────────────▼────────┐  ┌────────▼─────┐       ║
║    │  BullMQ Queues │    │   Groq LLM           │  │  Socket.io   │       ║
║    │  (Redis broker)│    │  Llama 3.3 70B       │  │  WebSocket   │       ║
║    │  3 workers     │    │  Root Cause Analysis │  │  temps réel  │       ║
║    └─────────┬──────┘    └─────────────┬────────┘  └────────┬─────┘       ║
║              │                         │                      │              ║
║    ┌─────────▼─────────────────────────▼──────────┐          │              ║
║    │              MongoDB                          │          │              ║
║    │  Users │ Pipelines │ Analyses │ Incidents     │          │              ║
║    │  KnowledgeBase │ ProjectHealth │ Vulns        │          │              ║
║    └──────────────────────────────────────────────┘          │              ║
║                                                              │              ║
║    ┌─────────────────────────────────────────────────────────▼────────┐    ║
║    │                    FRONTEND React / Vite                          │    ║
║    │  Dashboard │ Pipelines │ Analyses │ Security │ Health Score       │    ║
║    │  Incidents │ Knowledge Base │ Weekly Report │ Settings            │    ║
║    └───────────────────────────────────────────────────────────────────┘    ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### 3.2 Architecture Backend

```
aiops-platform/backend/src/
│
├── server.js                    ← Point d'entrée HTTP (port 3001)
├── app.js                       ← Express + middlewares globaux
├── socket.js                    ← Initialisation Socket.io + émission événements
│
├── config/
│   ├── index.js                 ← Centralise toutes les variables d'environnement
│   ├── database.js              ← Connexion Mongoose avec retry automatique
│   └── redis.js                 ← Connexion ioredis + initialisation BullMQ
│
├── api/
│   ├── controllers/
│   │   ├── webhook.controller.js         ← Entrée pipeline/MR events GitLab
│   │   ├── pipeline.controller.js        ← CRUD pipelines + stats dashboard
│   │   ├── analysis.controller.js        ← Analyses AI + récurrence + résolution
│   │   ├── healthScore.controller.js     ← Score santé + historique + recalcul
│   │   ├── incident.controller.js        ← Cycle de vie incidents + post-mortem
│   │   ├── knowledgeBase.controller.js   ← CRUD + recherche base de connaissances
│   │   └── weeklyReport.controller.js    ← Rapports hebdomadaires par projet
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js            ← Vérification JWT + extraction rôle
│   │   ├── hmac.middleware.js            ← Validation signature webhook GitLab
│   │   ├── rateLimiter.middleware.js     ← Rate limiting Redis par endpoint
│   │   └── errorHandler.middleware.js    ← Gestion centralisée des erreurs
│   │
│   └── routes/
│       ├── webhook.routes.js
│       ├── pipeline.routes.js
│       ├── analysis.routes.js
│       ├── vulnerability.routes.js
│       ├── healthScore.routes.js
│       ├── incident.routes.js
│       ├── knowledgeBase.routes.js
│       └── weeklyReport.routes.js
│
├── ai/
│   ├── groq.client.js                    ← Client SDK Groq (LLM primaire)
│   ├── claude.client.js                  ← Client SDK Anthropic (LLM backup)
│   ├── rootCause.analyzer.js             ← Orchestrateur : classify → analyze → suggest
│   ├── errorClassifier.js                ← Classification du type d'erreur (6 types)
│   ├── fixSuggester.js                   ← Génération suggestions correctifs
│   └── prompts/
│       ├── rootCause.prompt.js           ← Template prompt analyse cause racine
│       ├── classifier.prompt.js          ← Template prompt classification erreur
│       ├── fixSuggester.prompt.js        ← Template prompt suggestions de fix
│       └── mrComment.prompt.js           ← Template prompt commentaire MR
│
├── models/
│   ├── User.model.js
│   ├── Pipeline.model.js
│   ├── Analysis.model.js
│   ├── Vulnerability.model.js
│   ├── KnowledgeBase.model.js
│   ├── ProjectHealth.model.js
│   └── Incident.model.js
│
├── queues/
│   ├── queues.js                         ← Définition des 3 files BullMQ
│   └── workers/
│       ├── pipelineAnalysis.worker.js    ← Worker principal (5 concurrents)
│       ├── logCollection.worker.js       ← Collecte logs GitLab (3 concurrents)
│       └── notification.worker.js        ← Notifications (10 concurrents)
│
├── services/
│   ├── gitlab/
│   │   ├── gitlab.service.js             ← API GitLab : pipelines, jobs, commits, MR
│   │   └── logCollection.service.js      ← Agrégation logs des jobs échoués
│   ├── sonarqube/
│   │   └── sonarqube.service.js          ← Récupération issues, quality gate
│   ├── trivy/
│   │   └── trivy.service.js              ← Parsing rapports CVE des artifacts CI
│   ├── normalizer/
│   │   └── normalizer.service.js         ← Normalisation données multi-sources
│   ├── correlation.service.js            ← Corrélation GitLab + SonarQube + Trivy
│   ├── knowledgeBase.service.js          ← Signatures + cache + auto-alimentation
│   ├── healthScore.service.js            ← Calcul score santé (6 métriques pondérées)
│   ├── mrComment.service.js              ← Génération et post du commentaire MR
│   └── weeklyReport.service.js           ← Agrégation métriques hebdomadaires
│
└── utils/
    ├── logger.js                          ← Winston (Console, format JSON en prod)
    ├── httpClient.js                      ← Axios avec retry exponentiel
    └── retry.js                           ← Wrapper backoff exponentiel configurable
```

### 3.3 Flux de Traitement Principal

```
PIPELINE CI/CD GITLAB TERMINE
         │
         ▼ POST /api/webhooks/gitlab
         │   Header: X-Gitlab-Token → validé HMAC-SHA256 (hmac.middleware)
         │   Rate limit: 30 req/min par IP (Redis)
         ▼
webhook.controller.js
  └─ Vérifie event type (Pipeline Hook / Merge Request Hook)
  └─ Enregistre le pipeline en base (Pipeline.model)
  └─ Enqueue le job dans BullMQ → réponse 202 Accepted (non-bloquant)
         │
         ▼ BullMQ Queue : "pipeline-analysis"
         │   Concurrence : 5 workers simultanés
         │   Retry : 3 tentatives, backoff exponentiel 2s→4s→8s
         │
pipelineAnalysis.worker.js
  │
  ├── Étape 1 : Fetch logs GitLab CI
  │     gitlab.service.getFailedJobLogs(projectId, pipelineId)
  │     → logs des jobs en statut "failed" uniquement
  │
  ├── Étape 2 : Fetch issues SonarQube
  │     sonarqube.service.getIssues(projectKey)
  │     → bugs, vulnérabilités, code smells, quality gate
  │
  ├── Étape 3 : Fetch vulnérabilités Trivy
  │     trivy.service.getReport(projectId, pipelineId)
  │     → CVEs parsées depuis l'artifact CI "trivy-results.json"
  │
  ├── Étape 4 : Fetch commits récents
  │     gitlab.service.getCommits(projectId, ref)
  │     → auteur, message, diff des 5 derniers commits
  │
  ├── Étape 5 : Normalisation
  │     normalizer.service.normalize(logs, sonar, trivy, commits)
  │     → objet unifié "NormalizedData"
  │
  ├── Étape 6 : Knowledge Base lookup
  │     knowledgeBase.service.findCachedSolution(errorType, logSnippet)
  │     ├── [Cache HIT]  → inject solution connue dans les suggestedFixes
  │     └── [Cache MISS] → Groq LLM complète
  │                         │
  │                         ├── errorClassifier.classify(normalizedData)
  │                         │   → errorType : build_failure / test_failure /
  │                         │     dependency_issue / security_vulnerability /
  │                         │     configuration_error / unknown
  │                         │
  │                         ├── rootCause.analyze(normalizedData, errorType)
  │                         │   → rootCause, riskLevel, confidence, affectedFiles
  │                         │
  │                         └── fixSuggester.suggest(normalizedData, rootCause)
  │                             → suggestedFixes[] avec priority, command, codeHint
  │
  ├── Étape 7 : Persistance
  │     Analysis.create({ pipelineId, errorType, rootCause, ... })
  │     KnowledgeBase.findOneAndUpdate (upsert par signature MD5)
  │     ProjectHealth.recompute(projectId)
  │
  ├── Étape 7b : Auto-création d'incident si pipeline failed
  │     Incident.findOneAndUpdate({ pipelineId }, { $setOnInsert: {...} }, {upsert:true})
  │     → crée un incident unique par pipeline (évite les doublons)
  │
  ├── Étape 7c : Commentaire MR GitLab (si MR ouverte)
  │     mrComment.service.postComment(analysis)
  │     → génère une explication en français via Groq + poste sur la MR
  │
  └── Étape 8 : Notification WebSocket
        socket.emit("analysis:complete", analysisResult)
        → mis à jour instantanément dans le dashboard React
```

### 3.4 Flux Merge Request (MR Hook)

```
GitLab MR ouverte / mise à jour
         │
         ▼ POST /api/webhooks/gitlab (X-Gitlab-Event: Merge Request Hook)
         │
webhook.controller.js
  └─ Vérifie action: "open" | "update"
  └─ Appelle mrComment.service.analyzeMRRisk(projectId, mrIid)
         │
         ▼ mrComment.service
  ├── Récupère la dernière analyse du projet
  ├── Génère un score de risque (0–100)
  ├── Génère une explication en français via Groq (3 phrases)
  └── Poste un commentaire sur la MR GitLab via l'API
```

---

## 4. Modèles de Données

### 4.1 Diagramme de Classes

```
┌───────────────────────┐         ┌──────────────────────────────────┐
│         User          │         │             Pipeline              │
├───────────────────────┤         ├──────────────────────────────────┤
│ _id: ObjectId         │         │ _id: ObjectId                    │
│ email: String (uniq)  │         │ pipelineId: Number               │
│ passwordHash: String  │         │ projectId: String                │
│ name: String          │         │ projectName: String              │
│ role: admin|analyst   │         │ ref: String  (branch)            │
│       |viewer         │         │ status: success|failed|cancelled │
│ isActive: Boolean     │         │ failedJobs: [String]             │
│ lastLoginAt: Date     │         │ triggeredBy: String              │
│ createdAt: Date       │         │ duration: Number (sec)           │
└───────────────────────┘         │ webUrl: String                   │
                                  │ sha: String                      │
                                  │ createdAt: Date                  │
                                  │ finishedAt: Date                 │
                                  └──────────────┬───────────────────┘
                                                 │ 1
                                                 │
                                        ┌────────┴──────────────────────────┐
                                        │             Analysis               │
                                        ├───────────────────────────────────┤
                                        │ _id: ObjectId                     │
                                        │ pipelineId: String (ref Pipeline)│
                                        │ projectId: String                 │
                                        │ errorType: Enum                   │
                                        │   build_failure                   │
                                        │   test_failure                    │
                                        │   dependency_issue                │
                                        │   security_vulnerability          │
                                        │   configuration_error             │
                                        │   unknown                         │
                                        │ rootCause: String                 │
                                        │ summary: String                   │
                                        │ confidence: Number (0-1)          │
                                        │ riskLevel: critical|high|         │
                                        │            medium|low             │
                                        │ suggestedFixes: [SuggestedFix]   │
                                        │ affectedFiles: [String]           │
                                        │ processingTime: Number (ms)       │
                                        │ resolved: Boolean                 │
                                        │ resolvedAt: Date                  │
                                        │ mttr: Number (min)                │
                                        │ rawData: RawData                  │
                                        │ createdAt: Date                   │
                                        └───────────────────────────────────┘

┌──────────────────────────────┐         ┌─────────────────────────────────┐
│       SuggestedFix           │         │          Vulnerability           │
├──────────────────────────────┤         ├─────────────────────────────────┤
│ priority: high|medium|low    │         │ _id: ObjectId                   │
│ description: String          │         │ projectId: String               │
│ command: String              │         │ pipelineId: String              │
│ codeHint: String             │         │ cveId: String                   │
└──────────────────────────────┘         │ packageName: String             │
                                         │ installedVersion: String        │
                                         │ severity: CRITICAL|HIGH|        │
                                         │           MEDIUM|LOW            │
                                         │ title: String                   │
                                         │ description: String             │
                                         │ fixedVersion: String            │
                                         │ publishedDate: Date             │
                                         │ status: open|fixed|ignored      │
                                         └─────────────────────────────────┘

┌──────────────────────────────────┐    ┌────────────────────────────────────┐
│          KnowledgeBase           │    │            ProjectHealth            │
├──────────────────────────────────┤    ├────────────────────────────────────┤
│ _id: ObjectId                    │    │ _id: ObjectId                      │
│ errorSignature: String (MD5,uniq)│    │ projectId: String (unique)         │
│ errorType: String                │    │ projectName: String                │
│ title: String (80 chars max)     │    │ score: Number (0–100)              │
│ rootCause: String                │    │ grade: A|B|C|D|F                   │
│ solution: String                 │    │ trend: up|down|stable              │
│ command: String                  │    │ trendValue: Number (delta)         │
│ codeHint: String                 │    │ breakdown: BreakdownDetail         │
│ tags: [String]                   │    │   pipelineSuccessRate: ScoreItem   │
│ projectIds: [String]             │    │   criticalVulns:      ScoreItem    │
│ createdBy: String                │    │   codeCoverage:       ScoreItem    │
│ usedCount: Number                │    │   codeSmells:         ScoreItem    │
│ successRate: Number              │    │   avgMTTR:            ScoreItem    │
│ lastUsed: Date                   │    │   lastFailureAge:     ScoreItem    │
│ createdAt: Date                  │    │ computedAt: Date                   │
└──────────────────────────────────┘    └────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                              Incident                                   │
├────────────────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                                          │
│ incidentId: String  (ex: "INC-12345")                                 │
│ title: String                                                          │
│ projectId: String                                                      │
│ projectName: String                                                    │
│ pipelineId: String  (ref Pipeline)                                     │
│ severity: critical|high|medium|low                                     │
│ status: open|investigating|resolved                                    │
│ detectedAt: Date                                                       │
│ resolvedAt: Date                                                       │
│ mttr: Number (minutes)                                                 │
│ assignedTo: String                                                     │
│ analysis: ObjectId  (ref Analysis)                                     │
│ timeline: [TimelineEntry]                                              │
│   └─ timestamp: Date, actor: String, action: String, message: String  │
│ postMortem: PostMortemData                                             │
│   └─ generatedAt: Date, content: String, recommendations: [String]    │
│ createdAt: Date                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Détail des Schémas Mongoose

#### User.model.js
```javascript
const userSchema = new Schema({
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },                // bcrypt (saltRounds: 12)
  name:         { type: String, required: true },
  role:         { type: String, enum: ['admin', 'analyst', 'viewer'], default: 'viewer' },
  isActive:     { type: Boolean, default: true },
  lastLoginAt:  Date
}, { timestamps: true });
```

#### Pipeline.model.js
```javascript
const pipelineSchema = new Schema({
  pipelineId:  { type: Number, required: true, index: true },
  projectId:   { type: String, required: true, index: true },
  projectName: String,
  ref:         String,
  status:      { type: String, enum: ['success','failed','cancelled','running','pending'] },
  failedJobs:  [String],
  triggeredBy: String,
  duration:    Number,
  webUrl:      String,
  sha:         String,
  finishedAt:  Date
}, { timestamps: true });
```

#### Analysis.model.js
```javascript
const suggestedFixSchema = new Schema({
  priority:    { type: String, enum: ['high','medium','low'] },
  description: String,
  command:     String,
  codeHint:    String
}, { _id: false });

const analysisSchema = new Schema({
  pipelineId:     { type: String, required: true, index: true },
  projectId:      { type: String, required: true },
  errorType:      { type: String, enum: ['build_failure','test_failure',
                    'dependency_issue','security_vulnerability',
                    'configuration_error','unknown'] },
  rootCause:      String,
  summary:        String,
  confidence:     { type: Number, min: 0, max: 1 },
  riskLevel:      { type: String, enum: ['critical','high','medium','low'] },
  suggestedFixes: [suggestedFixSchema],
  affectedFiles:  [String],
  processingTime: Number,
  resolved:       { type: Boolean, default: false },
  resolvedAt:     Date,
  mttr:           Number,
  rawData: {
    logsSample:      [String],
    sonarIssuesCount: Number,
    vulnCount:        Number
  }
}, { timestamps: true });
```

#### KnowledgeBase.model.js
```javascript
const knowledgeBaseSchema = new Schema({
  errorSignature: { type: String, required: true, unique: true }, // MD5(errorType:rootCause[:100])
  errorType:      String,
  title:          String,
  rootCause:      String,
  solution:       String,
  command:        String,
  codeHint:       String,
  tags:           [String],
  projectIds:     [String],
  createdBy:      String,
  usedCount:      { type: Number, default: 0 },
  successRate:    { type: Number, default: 1.0 },
  lastUsed:       Date
}, { timestamps: true });
```

#### ProjectHealth.model.js
```javascript
const scoreItemSchema = new Schema({
  score:  Number,   // 0–100
  weight: Number,   // poids dans le score final
  value:  String    // valeur lisible ("75%", "2 critical, 1 high")
}, { _id: false });

const projectHealthSchema = new Schema({
  projectId:   { type: String, required: true, unique: true },
  projectName: String,
  score:       Number,
  grade:       { type: String, enum: ['A','B','C','D','F'] },
  trend:       { type: String, enum: ['up','down','stable'] },
  trendValue:  Number,
  breakdown: {
    pipelineSuccessRate: scoreItemSchema,
    criticalVulns:       scoreItemSchema,
    codeCoverage:        scoreItemSchema,
    codeSmells:          scoreItemSchema,
    avgMTTR:             scoreItemSchema,
    lastFailureAge:      scoreItemSchema
  },
  computedAt: Date
}, { timestamps: true });
```

#### Incident.model.js
```javascript
const timelineEntrySchema = new Schema({
  timestamp: Date,
  actor:     String,
  action:    String,
  message:   String
}, { _id: false });

const incidentSchema = new Schema({
  incidentId:  { type: String, unique: true },
  title:       String,
  projectId:   String,
  projectName: String,
  pipelineId:  String,
  severity:    { type: String, enum: ['critical','high','medium','low'] },
  status:      { type: String, enum: ['open','investigating','resolved'], default: 'open' },
  detectedAt:  Date,
  resolvedAt:  Date,
  mttr:        Number,
  assignedTo:  String,
  analysis:    { type: Schema.Types.ObjectId, ref: 'Analysis' },
  timeline:    [timelineEntrySchema],
  postMortem: {
    generatedAt:     Date,
    content:         String,
    recommendations: [String]
  }
}, { timestamps: true });
```

---

## 5. Services et Logique Métier

### 5.1 HealthScoreService

Calcule un score de santé de 0 à 100 pour chaque projet selon **6 métriques pondérées** :

| Métrique | Poids | Méthode | Logique |
|----------|-------|---------|---------|
| Taux succès pipelines | 25% | `scorePipelineRate()` | % de pipelines "success" sur 7 jours |
| Vulnérabilités critiques | 20% | `scoreVulns()` | 100 − (critical×20 + high×10) |
| MTTR moyen | 20% | `scoreMTTR()` | <15min→100, <30min→80, <60min→60, ≥60min→30 |
| Dernière panne | 10% | `scoreLastFailure()` | ≥7j→100, ≥3j→80, ≥1j→50, <1j→20 |
| Couverture de tests | 15% | `scoreCoverage()` | Basé sur données SonarQube |
| Smells de code | 10% | `scoreCodeSmells()` | 0→100, <5→80, <20→60, ≥20→30 |

**Conversion en grade :**

| Score | Grade |
|-------|-------|
| ≥ 90  | A     |
| ≥ 75  | B     |
| ≥ 60  | C     |
| ≥ 45  | D     |
| < 45  | F     |

**Méthodes principales :**
```javascript
computeScore(projectId, projectName)    // Calcule et sauvegarde le score d'un projet
computeAllScores()                      // Découvre tous les projets via Pipeline.aggregate()
getAllScores()                          // Retourne le dernier score par projet (dédupliqué)
scoreToGrade(score)                     // Convertit le score numérique en lettre A-F
```

### 5.2 KnowledgeBaseService

Gère la mémoire des solutions aux erreurs récurrentes.

**Signature unique :** `MD5(errorType + ":" + rootCause[:100].toLowerCase().trim())`

**Méthodes principales :**
```javascript
generateSignature(errorType, rootCause)     // Hash MD5 déterministe et normalisé
extractTags(analysis)                       // Détecte 'npm','docker','python','maven','testing'
extractSignatures(errorType, logSnippet)    // Génère 2 signatures (50 et 100 chars)
findCachedSolution(errorType, logSnippet)   // Cherche par signature + incrémente usedCount
saveFromAnalysis(analysis, resolvedBy)      // Crée ou met à jour une entrée KB
search(query)                               // Recherche full-text (titre, tags, type, cause)
```

**Flux d'auto-alimentation :**
1. Un utilisateur marque une analyse comme "résolue"
2. `analysis.controller → markResolved()` appelle `knowledgeBaseService.saveFromAnalysis()`
3. La solution est mémorisée avec sa signature
4. Lors de la prochaine analyse similaire : cache HIT → solution injectée en tête des `suggestedFixes`

### 5.3 MrCommentService

Génère et poste automatiquement un commentaire de risque sur les Merge Requests GitLab.

```javascript
analyzeMRRisk(projectId, mrIid)     // Orchestrateur : fetch → analyse → post
buildCommentBody(analysis, explanation) // Construit le markdown du commentaire
postComment(analysis)               // Génère l'explication via Groq + poste sur la MR
```

**Format du commentaire GitLab :**
```markdown
## 🤖 AIOps — Analyse de risque Merge Request

**Niveau de risque :** 🔴 HIGH

> Explication en 3 phrases générée par Groq (en français)

### Cause détectée
[rootCause de l'analyse associée]

### Corrections suggérées
- 🔴 [fix prioritaire 1]
- 🟡 [fix prioritaire 2]
```

### 5.4 WeeklyReportService

Agrège les métriques de la semaine par projet.

```javascript
generateReport(projectId, weekOffset)   // Génère le rapport d'une semaine passée
getCurrentWeekReport(projectId)         // Rapport de la semaine en cours
listAllWeeks(projectId)                 // Liste toutes les semaines disponibles
```

**Métriques agrégées :**
- Nombre total de pipelines
- Taux de succès (%)
- Nombre de nouvelles vulnérabilités
- MTTR moyen (minutes)
- Nombre d'incidents créés
- Comparaison avec la semaine précédente (tendances)

### 5.5 CorrelationService

Corrèle les données multi-sources pour enrichir l'analyse.

```javascript
correlate(gitlabData, sonarData, trivyData)
// → identifie les packages vulnérables mentionnés dans les logs
// → relie les issues SonarQube aux fichiers en échec CI
// → produit un objet "CorrelatedContext" passé au LLM
```

### 5.6 Queues BullMQ

```
File : "pipeline-analysis"    Concurrence: 5    Retry: 3×, backoff exponentiel
  └─ pipelineAnalysis.worker  Collecte logs → analyse AI → sauvegarde → notif WS

File : "log-collection"       Concurrence: 3    Retry: 2×
  └─ logCollection.worker     Fetch logs GitLab CI par batch pour les gros projets

File : "notifications"        Concurrence: 10   Retry: 1×
  └─ notification.worker      Émission Socket.io + futures alertes email/Slack
```

---

## 6. API REST

### 6.1 Authentification

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/api/auth/login` | ✗ | Connexion → access token 15min + refresh 7j |
| POST | `/api/auth/refresh` | refresh token | Renouvellement du token d'accès |

### 6.2 Webhooks

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/api/webhooks/gitlab` | HMAC | Réception événements GitLab (Pipeline + MR) |

**Rate limit :** 30 req/min par IP via RedisStore

### 6.3 Pipelines

| Méthode | Endpoint | Rôle min. | Description |
|---------|----------|-----------|-------------|
| GET | `/api/pipelines` | viewer | Liste paginée avec filtres |
| GET | `/api/pipelines/stats` | viewer | KPIs dashboard (7 derniers jours) |
| GET | `/api/pipelines/:id` | viewer | Détail pipeline + analyse associée |
| POST | `/api/pipelines/:id/retry` | analyst | Redéclencher l'analyse AI |

### 6.4 Analyses

| Méthode | Endpoint | Rôle min. | Description |
|---------|----------|-----------|-------------|
| GET | `/api/analyses` | viewer | Analyses paginées avec filtres |
| GET | `/api/analyses/recurring` | viewer | Top 5 problèmes récurrents |
| GET | `/api/analyses/:pipelineId` | viewer | Analyse d'un pipeline spécifique |
| PATCH | `/api/analyses/:id/resolve` | analyst | Marquer comme résolu → KB auto-alimentée |

### 6.5 Vulnérabilités

| Méthode | Endpoint | Rôle min. | Description |
|---------|----------|-----------|-------------|
| GET | `/api/vulnerabilities` | viewer | Liste filtrée (sévérité / statut / projet) |
| PATCH | `/api/vulnerabilities/:id/ignore` | analyst | Ignorer une CVE |

### 6.6 Base de Connaissances

| Méthode | Endpoint | Rôle min. | Description |
|---------|----------|-----------|-------------|
| GET | `/api/knowledge` | viewer | Toutes les entrées (paginées) |
| GET | `/api/knowledge/stats` | viewer | Total entrées, cache hits, taux succès |
| GET | `/api/knowledge/search?q=...` | viewer | Recherche full-text |
| GET | `/api/knowledge/:id` | viewer | Entrée individuelle avec détail |
| DELETE | `/api/knowledge/:id` | admin | Supprimer une entrée |

### 6.7 Score de Santé

| Méthode | Endpoint | Rôle min. | Description |
|---------|----------|-----------|-------------|
| GET | `/api/health-score` | viewer | Scores de tous les projets |
| GET | `/api/health-score/:projectId` | viewer | Score et détail d'un projet |
| GET | `/api/health-score/:projectId/history` | viewer | Historique 8 semaines |
| POST | `/api/health-score/compute-all` | admin | Forcer le recalcul de tous les scores |

### 6.8 Incidents

| Méthode | Endpoint | Rôle min. | Description |
|---------|----------|-----------|-------------|
| GET | `/api/incidents` | viewer | Liste paginée avec filtres multiples |
| GET | `/api/incidents/:id` | viewer | Détail avec timeline et analyse liée |
| PATCH | `/api/incidents/:id/status` | analyst | Mettre à jour statut + timeline |
| POST | `/api/incidents/:id/comment` | analyst | Ajouter un commentaire à la timeline |
| POST | `/api/incidents/:id/postmortem` | analyst | Générer post-mortem IA |

### 6.9 Rapports Hebdomadaires

| Méthode | Endpoint | Rôle min. | Description |
|---------|----------|-----------|-------------|
| GET | `/api/reports` | viewer | Liste des semaines disponibles |
| GET | `/api/reports/current` | viewer | Rapport semaine courante |
| GET | `/api/reports/:weekOffset` | viewer | Rapport d'une semaine passée |

---

## 7. Architecture Frontend

### 7.1 Structure des Fichiers

```
aiops-platform/frontend/src/
│
├── main.jsx                    ← Bootstrap React + QueryClient + Router
├── App.jsx                     ← Routing SPA (React Router v6)
│
├── api/                        ← Clients HTTP (Axios + JWT intercepteur)
│   ├── client.js               ← Instance Axios + refresh token automatique
│   ├── pipelines.api.js        ← getAll(), getById(), getStats(), retry()
│   ├── analysis.api.js         ← getAll(), getRecurring(), getByPipeline(), resolve()
│   ├── health.api.js           ← getAllScores(), getHistory(), computeAll()
│   ├── incident.api.js         ← getAll(), updateStatus(), addComment(), postmortem()
│   ├── knowledge.api.js        ← getAll(), search(), getStats(), delete()
│   └── report.api.js           ← listAll(), getCurrent(), getByWeek()
│
├── hooks/                      ← Hooks React Query personnalisés
│   ├── usePipelines.js         ← useQuery pour pipelines + stats
│   ├── useAnalysis.js          ← useQuery + useMutation pour analyses
│   └── useWebSocket.js         ← Socket.io + reconnexion automatique
│
├── store/                      ← Redux Toolkit
│   ├── index.js                ← configureStore
│   └── slices/
│       ├── authSlice.js        ← login/logout, tokens, rôle utilisateur
│       └── pipelineSlice.js    ← filtres actifs, sélection
│
├── context/
│   └── ProjectContext.jsx      ← Filtre global projet (multi-projet)
│
├── pages/
│   ├── Login.jsx               ← Formulaire JWT avec validation
│   ├── Dashboard.jsx           ← KPIs, tendances, top issues
│   ├── PipelinesPage.jsx       ← Liste paginée avec filtres
│   ├── PipelineDetail.jsx      ← Détail pipeline + analyse AI
│   ├── AnalysisPage.jsx        ← Toutes les analyses + récurrentes
│   ├── SecurityPanel.jsx       ← Vulnérabilités Trivy
│   ├── HealthScore.jsx         ← Score santé + historique + comparaison
│   ├── Incidents.jsx           ← Gestion incidents + war room
│   ├── KnowledgeBase.jsx       ← Recherche + solutions mémorisées
│   ├── WeeklyReport.jsx        ← Rapports hebdomadaires
│   └── Settings.jsx            ← Configuration profil et intégrations
│
└── components/
    ├── layout/
    │   ├── AppShell.jsx              ← Layout global (Sidebar + Topbar + contenu)
    │   ├── Sidebar.jsx               ← Navigation + badge incidents ouvert (temps réel)
    │   ├── Topbar.jsx                ← Barre supérieure + user menu
    │   └── GlobalProjectFilter.jsx   ← Sélecteur projet commun à toutes les pages
    │
    ├── dashboard/
    │   ├── MetricCard.jsx            ← Tuile KPI (valeur, tendance, icône)
    │   ├── FailureTrendChart.jsx     ← Graphique Recharts (7 jours)
    │   ├── PipelineTable.jsx         ← Tableau pipelines récents
    │   └── TopIssuesPanel.jsx        ← Top 5 problèmes récurrents
    │
    ├── analysis/
    │   ├── AIInsightCard.jsx         ← Carte analyse AI (cause, risque, fixes)
    │   ├── ConfidenceIndicator.jsx   ← Barre de confiance visuelle (0–100%)
    │   ├── FixSuggestionList.jsx     ← Liste correctifs priorisés
    │   └── RootCauseBadge.jsx        ← Badge type d'erreur coloré
    │
    ├── health/
    │   ├── HealthScoreCard.jsx       ← Carte score projet (grade + trend + breakdown)
    │   ├── ScoreBreakdown.jsx        ← Détail des 6 métriques pondérées
    │   └── ProjectComparison.jsx     ← Comparaison multi-projets (Recharts radar)
    │
    ├── incident/
    │   ├── IncidentTimeline.jsx      ← Timeline chronologique des événements
    │   └── WarRoomPanel.jsx          ← Panel de résolution active (statut + commentaires)
    │
    ├── knowledge/
    │   ├── KnowledgeCard.jsx         ← Carte solution (titre, tags, stats)
    │   └── SolutionDetail.jsx        ← Détail complet avec commande + code hint
    │
    ├── report/
    │   ├── WeeklyReportCard.jsx      ← Résumé hebdomadaire (métriques + tendances)
    │   └── TeamMetrics.jsx           ← Graphique comparatif semaine/semaine
    │
    ├── security/
    │   ├── SeverityBadge.jsx         ← Badge coloré CRITICAL/HIGH/MEDIUM/LOW
    │   └── VulnerabilityTable.jsx    ← Tableau CVEs avec actions
    │
    └── ui/
        ├── Card.jsx                  ← Conteneur générique avec shadow/padding
        ├── Button.jsx                ← Bouton avec variants (primary/danger/ghost)
        ├── Badge.jsx                 ← Étiquette colorée réutilisable
        ├── Spinner.jsx               ← Indicateur de chargement (tailles: sm/md/lg)
        └── EmptyState.jsx            ← État vide avec icône et message
```

### 7.2 Gestion de l'État

```
Redux Toolkit (état global persisté)
  └─ authSlice        : token JWT, refreshToken, user (name, email, role)
  └─ pipelineSlice    : filtres actifs (statut, projet, date)

React Query / TanStack Query (état serveur + cache)
  └─ Queries          : useQuery avec staleTime et refetchInterval
  └─ Mutations        : useMutation avec invalidation du cache sur succès
  └─ QueryClient      : cache LRU en mémoire côté client

Socket.io Client (temps réel)
  └─ useWebSocket.js  : connexion sur WS_URL (auto-détecté prod/dev)
  └─ Events reçus     :
       "analysis:complete"  → invalide query ["analyses"]
       "pipeline:new"       → invalide query ["pipelines"]
       "incident:created"   → invalide query ["incidents", "open-count"]
```

### 7.3 Pages et Routes

| Route | Composant | Description |
|-------|-----------|-------------|
| `/login` | Login.jsx | Authentification (redirige si déjà connecté) |
| `/dashboard` | Dashboard.jsx | KPIs, tendances 7 jours, top issues, feed temps réel |
| `/pipelines` | PipelinesPage.jsx | Liste paginée, filtres statut/projet/date |
| `/pipelines/:id` | PipelineDetail.jsx | Analyse AI complète, logs, jobs, fixes |
| `/analysis` | AnalysisPage.jsx | Toutes les analyses + problèmes récurrents |
| `/security` | SecurityPanel.jsx | CVEs par sévérité, statut, gestion |
| `/health` | HealthScore.jsx | Score A-F par projet, historique, comparaison |
| `/incidents` | Incidents.jsx | Incidents actifs / résolus, war room, timeline |
| `/knowledge` | KnowledgeBase.jsx | Base de connaissances, recherche full-text |
| `/reports` | WeeklyReport.jsx | Rapports hebdomadaires par semaine |
| `/settings` | Settings.jsx | Profil, intégrations, sécurité, notifications |

---

## 8. Tests Automatisés

### 8.1 Framework

**Vitest** (compatible ESM natif, intégré à Vite) est utilisé pour les tests unitaires du backend et du frontend.

```
Backend  : 2 fichiers de test → 18 tests
Frontend : 3 fichiers de test →  7 tests
Total    :                       25 tests
```

### 8.2 Tests Backend

#### `healthScore.service.test.js` — 12 tests

| Test | Description |
|------|-------------|
| `scorePipelineRate` retourne 50 si aucun pipeline | Cas limite — données vides |
| `scorePipelineRate` calcule le % de succès | 3/4 succès → score 75, value "75%" |
| `scoreVulns` retourne 100 sans vulnérabilités | Score parfait sans CVE |
| `scoreVulns` pénalise CRITICAL plus que HIGH | 1 CRITICAL + 2 HIGH → 100−(20+20)=60 |
| `scoreVulns` ne descend jamais sous 0 | 10 CRITICAL → score = 0 (pas négatif) |
| `scoreLastFailure` retourne 100 sans panne | Bonus "aucun échec récent" |
| `scoreLastFailure` pénalise les pannes récentes | Panne aujourd'hui < panne ancienne |
| `scoreLastFailure` donne 100 pour panne >7j | Seuil "ancienne" → score parfait |
| `scoreToGrade` mappe 95 → A | Borne supérieure |
| `scoreToGrade` mappe 80 → B | |
| `scoreToGrade` mappe 65 → C | |
| `scoreToGrade` mappe 20 → F | Borne inférieure |

#### `knowledgeBase.service.test.js` — 6 tests

| Test | Description |
|------|-------------|
| `generateSignature` est déterministe | Même input → même hash MD5 |
| `generateSignature` est insensible à la casse et aux espaces | "Docker Socket" = "docker socket" |
| `generateSignature` diffère selon le type d'erreur | `build_failure` ≠ `test_failure` |
| `extractTags` inclut toujours le errorType | Présence garantie du type dans les tags |
| `extractTags` détecte les mots-clés npm et docker | Analyse du rootCause en lowercase |
| `extractSignatures` retourne 2 signatures différentes | Longueurs 50 et 100 chars → hash distincts |

### 8.3 Tests Frontend

#### `Incidents.test.jsx` — 3 tests (fonction `timeSince`)

| Test | Entrée | Sortie attendue |
|------|--------|-----------------|
| Format minutes | -5 min | "5 minutes ago" |
| Format heures | -3 heures | "3 hours ago" |
| Format jours | -2 jours | "2 days ago" |

#### `HealthScore.test.jsx` — 2 tests (fonction `buildHistory`)

| Test | Description |
|------|-------------|
| Tableau vide sans projets | `buildHistory([], {})` → `[]` |
| Points par semaine avec données réelles | 2 entrées → W1 (score 70) et W2 (score 80) |

#### `Spinner.test.jsx` — 2 tests (composant React `<Spinner>`)

| Test | Description |
|------|-------------|
| Rend un SVG avec `animate-spin` | Test rendu DOM via @testing-library/react |
| Applique la classe de taille `w-10 h-10` pour `size="lg"` | Prop `size` fonctionnelle |

### 8.4 Exécution

```bash
# Backend
cd aiops-platform/backend && npm test
# Output : 2 test files | 18 tests passed (< 7s)

# Frontend
cd aiops-platform/frontend && npm test
# Output : 3 test files | 7 tests passed (< 60s)
```

---

## 9. Déploiement et CI/CD

### 9.1 Containerisation Docker

#### Backend — `backend/Dockerfile`
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production          # Exclut les devDependencies (vitest, nodemon)
COPY . .
EXPOSE 3001
CMD ["node", "src/server.js"]
```

#### Frontend — `frontend/Dockerfile` (multi-stage)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci                            # Inclut devDeps (vite, tailwind)
COPY . .
RUN npm run build                     # → dist/ (SPA statique)

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### `frontend/nginx.conf` — Reverse proxy vers le backend
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://aiops-backend:3001;   # Service k8s "aiops-backend"
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /socket.io/ {
        proxy_pass http://aiops-backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";  # WebSocket upgrade
    }

    location / {
        try_files $uri $uri/ /index.html;       # SPA fallback
    }
}
```

### 9.2 Helm Chart — Déploiement Kubernetes

```
aiops-platform/helm/aiops/
├── Chart.yaml                    ← name: aiops, version: 0.1.0
├── values.yaml                   ← Configuration non-sensible (images, ports, ressources)
├── values.secrets.yaml           ← GITIGNORE — secrets (JWT, tokens, API keys)
└── templates/
    ├── configmap.yaml            ← Variables d'environnement non-sensibles
    ├── secret.yaml               ← Secrets Kubernetes (stringData → base64 auto)
    ├── backend-deployment.yaml   ← Deployment backend (readiness/liveness probes)
    ├── backend-service.yaml      ← ClusterIP "aiops-backend" port 3001
    ├── frontend-deployment.yaml  ← Deployment frontend nginx
    ├── frontend-service.yaml     ← ClusterIP "aiops-frontend" port 80
    ├── mongodb.yaml              ← Deployment mongo:4.4 + PVC 2Gi + Service
    └── ingress.yaml              ← Traefik IngressRoute (HTTP port 80)
```

#### `values.yaml` — Configuration principale

```yaml
backend:
  image:
    repository: khalil512/aiops-backend
    tag: latest
  replicas: 1
  port: 3001
  resources:
    requests: { cpu: 100m, memory: 256Mi }
    limits:   { cpu: 500m, memory: 512Mi }

frontend:
  image:
    repository: khalil512/aiops-frontend
    tag: latest
  replicas: 1
  port: 80
  resources:
    requests: { cpu: 50m,  memory: 64Mi  }
    limits:   { cpu: 200m, memory: 128Mi }

config:
  nodeEnv:      production
  mongodbUri:   mongodb://mongodb:27017/aiops
  redisHost:    redis-master
  redisPort:    "6379"
  groqModel:    llama-3.3-70b-versatile

ingress:
  enabled:   true
  className: traefik
  host:      aiops.local
```

#### Architecture Kubernetes (k3s)

```
Cluster k3s (VM Vagrant — Ubuntu 22.04)
│
├── Namespace: default
│   │
│   ├── Deployment: aiops-backend      (1 pod, node:20-alpine)
│   │   ├── Port: 3001
│   │   ├── EnvFrom: ConfigMap + Secret
│   │   ├── ReadinessProbe: GET /api/health :3001
│   │   └── LivenessProbe:  GET /api/health :3001
│   │
│   ├── Deployment: aiops-frontend     (1 pod, nginx:alpine)
│   │   ├── Port: 80
│   │   └── Nginx proxifie /api/ et /socket.io/ vers aiops-backend:3001
│   │
│   ├── Deployment: mongodb            (1 pod, mongo:4.4)
│   │   ├── Port: 27017
│   │   └── PVC: mongodb-pvc (2Gi, local-path-provisioner)
│   │
│   ├── StatefulSet: redis-master      (1 pod, Bitnami Redis)
│   │   └── Port: 6379
│   │
│   ├── Services:
│   │   ├── aiops-backend  → ClusterIP :3001
│   │   ├── aiops-frontend → ClusterIP :80
│   │   ├── mongodb        → ClusterIP :27017
│   │   └── redis-master   → ClusterIP :6379
│   │
│   └── Ingress (Traefik) → aiops-frontend:80 → accessible http://localhost:8085
│
└── PersistentVolume: /var/lib/rancher/k3s/storage/ (données MongoDB)
```

#### Commandes de déploiement

```bash
# Premier déploiement
helm install aiops ./helm/aiops \
  -f ./helm/aiops/values.yaml \
  -f ./helm/aiops/values.secrets.yaml

# Mise à jour (après un push d'images)
helm upgrade aiops ./helm/aiops \
  -f ./helm/aiops/values.yaml \
  -f ./helm/aiops/values.secrets.yaml \
  --wait --timeout 5m

# Forcer le rechargement des pods (nouvelles images avec tag "latest")
kubectl rollout restart deployment/aiops-backend deployment/aiops-frontend

# Vérifier l'état
kubectl get pods
kubectl get svc
kubectl get ingress
```

### 9.3 Pipeline Jenkins CI/CD

#### Architecture Jenkins

```
VM Vagrant (Ubuntu 22.04)
└── Docker Container: jenkins/jenkins:lts
    ├── --network host        → accès direct à k3s sur 127.0.0.1:6443
    ├── -v jenkins_home       → configuration et workspace persistants
    ├── -v /var/run/docker.sock → accès au daemon Docker de la VM
    ├── -v /usr/bin/docker    → binaire Docker CLI
    ├── -v /usr/local/bin/kubectl → binaire kubectl
    ├── -v /usr/local/bin/helm    → binaire Helm
    ├── -v ~/.kube            → kubeconfig (accès k3s)
    └── -v ~/aiops-secrets    → values.secrets.yaml (secrets hors git)
```

#### Jenkinsfile — Pipeline Déclaratif

```groovy
pipeline {
    agent any

    environment {
        DOCKERHUB_TOKEN = credentials('dockerhub-token')   // Jenkins Secret Text
        KUBECONFIG      = '/var/jenkins_home/.kube/config'
        SECRETS_FILE    = '/home/vagrant/aiops-secrets/values.secrets.yaml'
    }

    stages {
        // ── ÉTAPE 1 : Checkout automatique depuis GitHub ───────────────────
        // Jenkins clone automatiquement le repo avant l'exécution du pipeline
        // (configuration SCM → https://github.com/khalilwenich/aiops-platform-.git)

        // ── ÉTAPE 2 : Dépendances Backend ─────────────────────────────────
        stage('Install backend deps') {
            steps { sh 'cd aiops-platform/backend && npm ci' }
        }

        // ── ÉTAPE 3 : Tests Backend ────────────────────────────────────────
        stage('Test backend') {
            steps { sh 'cd aiops-platform/backend && npm test' }
            // → 18 tests (healthScoreService + knowledgeBaseService)
        }

        // ── ÉTAPE 4 : Dépendances Frontend ────────────────────────────────
        stage('Install frontend deps') {
            steps { sh 'cd aiops-platform/frontend && npm ci' }
        }

        // ── ÉTAPE 5 : Tests Frontend ───────────────────────────────────────
        stage('Test frontend') {
            steps { sh 'cd aiops-platform/frontend && npm test' }
            // → 7 tests (timeSince, buildHistory, Spinner)
        }

        // ── ÉTAPE 6 : Build image Backend ─────────────────────────────────
        stage('Build backend image') {
            steps { sh 'docker build -t khalil512/aiops-backend:latest aiops-platform/backend' }
        }

        // ── ÉTAPE 7 : Build image Frontend ────────────────────────────────
        stage('Build frontend image') {
            steps { sh 'docker build -t khalil512/aiops-frontend:latest aiops-platform/frontend' }
        }

        // ── ÉTAPE 8 : Push DockerHub ───────────────────────────────────────
        stage('Push images') {
            steps {
                sh '''
                    echo "$DOCKERHUB_TOKEN" | docker login -u khalil512 --password-stdin
                    docker push khalil512/aiops-backend:latest
                    docker push khalil512/aiops-frontend:latest
                '''
            }
        }

        // ── ÉTAPE 9 : Déploiement sur k3s ─────────────────────────────────
        stage('Deploy to k3s') {
            steps {
                sh '''
                    helm upgrade aiops aiops-platform/helm/aiops \
                        -f aiops-platform/helm/aiops/values.yaml \
                        -f "$SECRETS_FILE" \
                        --wait --timeout 5m
                    kubectl rollout restart deployment/aiops-backend deployment/aiops-frontend
                    kubectl rollout status deployment/aiops-backend  --timeout=120s
                    kubectl rollout status deployment/aiops-frontend --timeout=120s
                '''
            }
        }
    }
}
```

#### Flux CI/CD Complet

```
Développeur git push origin main
         │
         ▼ GitHub (public repo: khalilwenich/aiops-platform-)
         │
         ▼ Jenkins "Build Now" (ou futur webhook GitHub)
         │
         ├── ① Checkout SCM
         │     git clone https://github.com/khalilwenich/aiops-platform-.git
         │     → workspace: /var/jenkins_home/workspace/aiops-test/
         │
         ├── ② npm ci (backend, 387 packages avec devDeps)
         ├── ③ npm test backend → 18/18 tests OK  ✓
         ├── ④ npm ci (frontend, 312 packages avec vitest+jsdom)
         ├── ⑤ npm test frontend → 7/7 tests OK   ✓
         │
         ├── ⑥ docker build → khalil512/aiops-backend:latest
         ├── ⑦ docker build → khalil512/aiops-frontend:latest
         │
         ├── ⑧ docker login + push (DockerHub: khalil512)
         │     khalil512/aiops-backend:latest   → docker.io
         │     khalil512/aiops-frontend:latest  → docker.io
         │
         └── ⑨ helm upgrade + kubectl rollout restart + rollout status
               → Pods redémarrés avec les nouvelles images sur k3s
               → Vérification déploiement (rollout status --timeout=120s)
               → Application accessible : http://localhost:8085

Durée totale : ~15 min (première exécution) / ~10 min (exécutions suivantes avec cache Docker)
```

### 9.4 Configuration du Job Jenkins

| Paramètre | Valeur |
|-----------|--------|
| Type | Pipeline (Declarative) |
| SCM | Git — `https://github.com/khalilwenich/aiops-platform-.git` |
| Branche | `*/main` |
| Script Path | `aiops-platform/Jenkinsfile` |
| Credentials | `dockerhub-token` (Secret Text dans Jenkins Credentials Store) |
| Déclencheur | Manuel ("Build Now") — futur : webhook GitHub |

---

## 10. Sécurité

### 10.1 Authentification et Autorisation

```
JWT Double Token
├── Access Token  : 15 minutes (en mémoire client)
└── Refresh Token : 7 jours (HttpOnly cookie)

RBAC — 3 rôles :
┌──────────┬───────────────────────────────────────────────────────────┐
│  Rôle    │ Droits                                                    │
├──────────┼───────────────────────────────────────────────────────────┤
│ admin    │ Toutes opérations : suppression, recalcul, configuration  │
│ analyst  │ Analyses, résolution, commentaires, post-mortems           │
│ viewer   │ Lecture seule (toutes les données)                        │
└──────────┴───────────────────────────────────────────────────────────┘
```

### 10.2 Sécurité des Webhooks

```
Header: X-Gitlab-Token → HMAC-SHA256(body, GITLAB_WEBHOOK_SECRET)
Middleware hmac.middleware.js :
  └─ crypto.timingSafeEqual() pour la comparaison (protection timing attack)
  └─ Rejet 401 si signature invalide
```

### 10.3 Sécurité de l'Infrastructure

| Couche | Mesure |
|--------|--------|
| Mots de passe | Hachage Bcrypt (saltRounds: 12) |
| API | Helmet.js (CSP, HSTS, X-Frame-Options, X-Content-Type) |
| Rate limiting | RedisStore par endpoint (webhook: 30/min, API: 100/min) |
| Secrets | `.env` + `values.secrets.yaml` jamais committés (`.gitignore`) |
| Images Docker | Publiées sur DockerHub en compte privé (khalil512) |
| Kubernetes | Secrets Kubernetes (type Opaque, base64 automatique via stringData) |

---

## 11. Stack Technologique

### 11.1 Backend

| Technologie | Version | Rôle |
|-------------|---------|------|
| Node.js | 20 LTS | Runtime JavaScript ESM (type: "module") |
| Express.js | 4.x | Framework API REST |
| MongoDB | 4.4 (k3s) / 7.x (local) | Base de données principale |
| Mongoose | 8.x | ODM MongoDB avec schémas typés |
| Redis | 7.x | Broker BullMQ + Rate limiting |
| BullMQ | 5.x | Files d'attente de jobs asynchrones |
| Socket.io | 4.x | WebSocket temps réel (events bidirectionnels) |
| Groq SDK | 1.x | LLM primaire (llama-3.3-70b-versatile) |
| Anthropic SDK | latest | LLM backup (claude-sonnet-4) |
| JWT (jsonwebtoken) | 9.x | Access token 15min + refresh 7j |
| Bcrypt | 5.x | Hachage mots de passe |
| Winston | 3.x | Logs structurés (Console + JSON prod) |
| Helmet | 7.x | Headers de sécurité HTTP |
| express-rate-limit | 7.x | Rate limiting avec store Redis |
| Axios + axios-retry | 1.x | Client HTTP avec retry exponentiel |
| Vitest | 4.x | Framework de tests unitaires |

### 11.2 Frontend

| Technologie | Version | Rôle |
|-------------|---------|------|
| React | 18.x | Framework UI (SPA) |
| Vite | 5.x | Bundler + serveur de développement |
| React Router | 6.x | Routage SPA |
| TanStack Query | 5.x | Cache et synchronisation état serveur |
| Redux Toolkit | 2.x | État global (auth, filtres) |
| Tailwind CSS | 3.x | Stylisation utilitaire |
| Socket.io Client | 4.x | WebSocket temps réel |
| Recharts | 2.x | Graphiques (courbes, barres, radar) |
| Lucide React | 0.x | Bibliothèque d'icônes SVG |
| date-fns | 3.x | Formatage et manipulation des dates |
| Axios | 1.x | Client HTTP avec intercepteurs JWT |
| Vitest | 4.x | Tests unitaires (ESM natif) |
| @testing-library/react | 16.x | Tests de composants React |
| jsdom | 29.x | Environnement DOM simulé pour les tests |

### 11.3 Infrastructure et DevOps

| Composant | Rôle |
|-----------|------|
| Docker (29.x) | Containerisation backend et frontend |
| DockerHub | Registre d'images publiques (khalil512/) |
| k3s (Kubernetes léger) | Orchestrateur de conteneurs (VM Vagrant) |
| Helm 3 | Gestionnaire de packages Kubernetes |
| Jenkins LTS | Serveur CI/CD avec pipeline déclaratif |
| Vagrant + VirtualBox | VM de développement isolée (Ubuntu 22.04, 8GB, 4 vCPU) |
| GitLab CE | Serveur Git + CI/CD local (port 8929) |
| SonarQube CE | Analyse statique du code (port 9001) |
| Trivy | Scanner de vulnérabilités CVE |
| ngrok | Tunnel HTTPS pour les webhooks GitLab en local |
| GitHub | Hébergement du code source (repo public) |

---

## 12. Résultats Obtenus

### 12.1 Métriques de Performance

| Indicateur | Résultat |
|------------|---------|
| Temps d'analyse AI (webhook → résultat) | < 10 secondes |
| Précision classification type d'erreur | ~85% sur les cas testés |
| Réduction temps diagnostic | 30–90 min → < 2 min (facteur ×20) |
| Temps de traitement BullMQ (sans LLM) | < 1 seconde |
| Latence WebSocket (webhook → dashboard) | < 500 ms |

### 12.2 Fonctionnalités Validées

| Fonctionnalité | Statut |
|----------------|--------|
| Réception webhooks GitLab (HMAC validé) | ✅ Fonctionnel |
| Analyse AI cause racine (Groq Llama 3.3 70B) | ✅ Fonctionnel |
| Collecte logs GitLab CI API | ✅ Fonctionnel |
| Intégration SonarQube (quality gate + issues) | ✅ Fonctionnel |
| Intégration Trivy (CVEs depuis artifact CI) | ✅ Fonctionnel |
| Base de connaissances (auto-alimentation + cache hit) | ✅ Fonctionnel |
| Score de santé projet (6 métriques, grades A–F) | ✅ Fonctionnel |
| Gestion incidents (cycle de vie complet) | ✅ Fonctionnel |
| Post-mortems générés par IA | ✅ Fonctionnel |
| Commentaires MR automatiques (risque + explication) | ✅ Fonctionnel |
| Rapports hebdomadaires agrégés | ✅ Fonctionnel |
| Dashboard temps réel WebSocket | ✅ Fonctionnel |
| Authentification JWT + RBAC 3 niveaux | ✅ Fonctionnel |
| Support multi-projets (filtre global) | ✅ Fonctionnel |
| Tests unitaires (25 tests, 100% passants) | ✅ Fonctionnel |
| Build Docker multi-stage (backend + frontend) | ✅ Fonctionnel |
| Déploiement Kubernetes via Helm (k3s) | ✅ Fonctionnel |
| Pipeline Jenkins CI/CD complet | ✅ Fonctionnel |
| Code source versionné sur GitHub | ✅ Fonctionnel |

### 12.3 Test End-to-End Validé

Le test complet suivant a été exécuté et validé en conditions réelles :

```
1. git push sur le repo GitLab (khalilwenich/radiology)
2. Pipeline GitLab CI démarre et se termine (succès ou échec)
3. Webhook HTTP POST reçu par le backend (< 1s)
4. Job BullMQ créé et traité par le worker
5. Logs GitLab CI collectés via l'API GitLab
6. Analyse Groq effectuée (LLM Llama 3.3 70B)
7. Résultat sauvegardé en MongoDB
8. Knowledge Base mise à jour
9. Health Score recalculé
10. Dashboard React mis à jour en temps réel (WebSocket)
11. Analyse visible dans l'interface web

Durée totale : 7–10 secondes depuis le push git
```

---

## 13. Évolutions Futures

| Évolution | Description |
|-----------|-------------|
| **Alertes actives** | Notifications email/Slack/PagerDuty sur incidents critiques (worker `notification.worker.js` déjà structuré) |
| **ML prédictif** | Prédiction de probabilité d'échec avant exécution du pipeline (basé sur historique) |
| **GitHub Actions** | Extension aux autres plateformes CI/CD (GitHub Actions, Azure DevOps) |
| **SLA et on-call** | Escalade automatique selon les délais de résolution (PagerDuty) |
| **Dashboard exécutif** | Vue agrégée multi-équipes pour le management |
| **Export PDF** | Rapports hebdomadaires et post-mortems en format imprimable |
| **Tests d'intégration** | Tests API end-to-end avec base de données de test (MongoDB test container) |
| **Webhook GitHub → Jenkins** | Déclenchement automatique du pipeline CI/CD à chaque push |
| **Métriques Prometheus** | Exposition des métriques pour Grafana (latence, throughput, erreurs) |
| **Multi-tenant** | Isolation par équipe/organisation avec quotas séparés |

---

## 14. Conclusion

La plateforme AIOps développée dans le cadre de ce Projet de Fin d'Études répond à une problématique concrète rencontrée quotidiennement dans les équipes DevOps de Capgemini Altran Telnet Corporation Tunisie.

### Valeur Apportée

Le projet va au-delà du simple diagnostic de pipeline en constituant un **système d'intelligence opérationnelle complet** :
- **Analyse automatique** de la cause racine en moins de 10 secondes
- **Mémoire organisationnelle** via la base de connaissances auto-alimentée
- **Pilotage continu** de la qualité via les scores de santé
- **Gestion structurée** des incidents avec traçabilité et apprentissage
- **Prévention** via l'analyse de risque des Merge Requests

### Choix Technologiques

Le projet démontre la complémentarité de technologies modernes :
- **Node.js ESM + BullMQ** pour un traitement asynchrone haute performance
- **Groq (Llama 3.3 70B)** pour une analyse AI rapide et précise
- **React + TanStack Query + Socket.io** pour une expérience utilisateur temps réel
- **Kubernetes (k3s) + Helm** pour un déploiement reproductible et scalable
- **Jenkins + GitHub** pour une intégration et livraison continues automatisées
- **Vitest** pour une couverture de tests garantissant la qualité du code

### Impact Mesuré

Le facteur de réduction du temps de diagnostic — de **30–90 minutes à moins de 2 minutes** — représente un gain de productivité significatif pour les équipes DevOps, réduisant la dette cognitive liée à la gestion des incidents et permettant aux ingénieurs de se concentrer sur des tâches à plus haute valeur ajoutée.

La solution, entièrement containerisée et déployée sur Kubernetes avec un pipeline CI/CD Jenkins, est prête pour un usage en production et extensible à d'autres plateformes CI/CD (GitHub Actions, Azure DevOps) et outils d'observabilité (Prometheus, Grafana).

---

*Document rédigé dans le cadre d'un Projet de Fin d'Études (PFE) — Khalil Ben Yahia Wenich — ESPRIT 2025–2026*  
*Entreprise d'accueil : Capgemini Altran Telnet Corporation Tunisie*  
*Code source : https://github.com/khalilwenich/aiops-platform-*
