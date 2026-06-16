# Cahier des Charges
## Plateforme AIOps — Analyse Intelligente des Pipelines CI/CD

---

**Établissement :** [Nom de l'établissement]  
**Filière :** [Génie Logiciel / Informatique / DevOps]  
**Année académique :** 2025–2026  
**Auteur :** [Nom de l'étudiant]  
**Encadrant :** [Nom de l'encadrant]  
**Date :** Mai 2026  

---

## 1. Contexte et Problématique

### 1.1 Contexte général

Dans un environnement de développement logiciel moderne, les équipes adoptent massivement les pratiques DevOps et CI/CD (Intégration Continue / Déploiement Continu). Ces pratiques génèrent des centaines de pipelines par jour, chacun produisant des logs volumineux, des rapports de qualité et des résultats de sécurité.

### 1.2 Problématique

Lorsqu'un pipeline échoue ou présente des anomalies, les ingénieurs doivent :

- Parcourir manuellement des milliers de lignes de logs
- Corréler les résultats de plusieurs outils (GitLab CI, SonarQube, Trivy)
- Identifier la cause racine sans assistance automatisée
- Gérer les incidents sans traçabilité centralisée
- Perdre un temps précieux sur des tâches répétitives et des problèmes récurrents

**Temps moyen de diagnostic manuel : 30 à 90 minutes par incident.**

### 1.3 Solution proposée

Développement d'une plateforme **AIOps** (Artificial Intelligence for IT Operations) qui automatise l'analyse des pipelines CI/CD grâce à l'intelligence artificielle, centralise les résultats de qualité de code et de sécurité, et offre une gestion complète des incidents avec apprentissage automatique des solutions récurrentes.

---

## 2. Présentation du Projet

### 2.1 Définition

La plateforme AIOps est une application web full-stack qui :

1. **Reçoit** les événements des pipelines GitLab via webhooks sécurisés (HMAC-SHA256)
2. **Collecte** automatiquement les logs CI, les rapports SonarQube et les rapports Trivy
3. **Analyse** les données avec un LLM (Groq — Llama 3 70B) et calcule le risque de fusion
4. **Apprend** des patterns récurrents via une base de connaissances auto-alimentée
5. **Mesure** la santé de chaque projet avec un score pondéré (A → F)
6. **Gère** les incidents avec traçabilité complète et génération de post-mortems par IA
7. **Rapporte** les métriques hebdomadaires agrégées par équipe et projet
8. **Présente** tous les résultats dans un dashboard interactif en temps réel

### 2.2 Objectifs

| Objectif | Description |
|----------|-------------|
| **O1** | Réduire le temps de diagnostic d'un pipeline de 30–90 min à moins de 2 min |
| **O2** | Centraliser les données GitLab CI, SonarQube et Trivy en une seule interface |
| **O3** | Fournir une analyse AI de la cause racine avec suggestions de corrections priorisées |
| **O4** | Détecter et alerter sur les vulnérabilités de sécurité des images Docker |
| **O5** | Mémoriser les solutions aux problèmes récurrents dans une base de connaissances |
| **O6** | Offrir un score de santé par projet pour piloter la qualité en continu |
| **O7** | Gérer le cycle de vie des incidents avec post-mortems générés par IA |
| **O8** | Évaluer le risque des Merge Requests avant fusion |
| **O9** | Produire des rapports hebdomadaires automatiques de métriques DevOps |

---

## 3. Architecture Technique

### 3.1 Vue d'ensemble

```
┌──────────────────────────────────────────────────────────────────────┐
│                       ENVIRONNEMENT CI/CD                            │
│                                                                      │
│  ┌──────────┐  Webhook   ┌────────────────────────────────────────┐  │
│  │  GitLab  │───────────▶│             AIOps Backend              │  │
│  │    CI    │            │               Node.js / Express        │  │
│  └──────────┘            │                                        │  │
│       │ API              │  ┌──────────┐  ┌──────────┐           │  │
│       └─────────────────▶│  │  BullMQ  │  │  Socket  │           │  │
│                           │  │  Queues  │  │    .io   │           │  │
│  ┌──────────┐  Issues     │  └────┬─────┘  └────┬─────┘          │  │
│  │SonarQube │────────────▶│       │              │ WebSocket      │  │
│  └──────────┘             │  ┌────▼──────────┐   │               │  │
│                           │  │    Workers    │   │               │  │
│  ┌──────────┐  Vulns      │  │  (Async Jobs) │   │               │  │
│  │  Trivy   │────────────▶│  └────┬──────────┘   │               │  │
│  └──────────┘             └───────┼──────────────┼───────────────┘  │
│                                   │              │                   │
│                          ┌────────▼──────┐       │                   │
│                          │   Groq LLM    │       │                   │
│                          │  (Llama 3 70B)│       │                   │
│                          └────────┬──────┘       │                   │
│                                   │              │                   │
│                          ┌────────▼──────┐  ┌────▼──────────────┐   │
│                          │   MongoDB     │  │  React Dashboard  │   │
│                          │   + Redis     │  │  (Temps réel)     │   │
│                          └───────────────┘  └───────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.2 Architecture Backend

```
src/
├── api/
│   ├── controllers/
│   │   ├── webhook.controller.js        # Réception événements GitLab
│   │   ├── pipeline.controller.js       # CRUD pipelines + stats
│   │   ├── analysis.controller.js       # Analyses AI + récurrence
│   │   ├── healthScore.controller.js    # Score de santé projet
│   │   ├── incident.controller.js       # Gestion des incidents
│   │   ├── knowledgeBase.controller.js  # Base de connaissances
│   │   └── weeklyReport.controller.js   # Rapports hebdomadaires
│   ├── middlewares/
│   │   ├── auth.middleware.js           # JWT + RBAC
│   │   ├── hmac.middleware.js           # Validation signatures GitLab
│   │   ├── rateLimiter.middleware.js    # Rate limiting par endpoint
│   │   └── errorHandler.middleware.js   # Gestion globale des erreurs
│   └── routes/
│       ├── pipeline.routes.js
│       ├── analysis.routes.js
│       ├── vulnerability.routes.js
│       ├── healthScore.routes.js
│       ├── incident.routes.js
│       ├── knowledgeBase.routes.js
│       └── weeklyReport.routes.js
├── ai/
│   ├── groq.client.js                   # Client Groq (LLM primaire)
│   ├── claude.client.js                 # Client Claude (LLM secondaire)
│   ├── rootCause.analyzer.js            # Orchestrateur d'analyse AI
│   ├── errorClassifier.js               # Classification du type d'erreur
│   ├── fixSuggester.js                  # Génération de suggestions
│   └── prompts/
│       ├── rootCause.prompt.js          # Prompt analyse de cause racine
│       ├── classifier.prompt.js         # Prompt classification d'erreur
│       ├── fixSuggester.prompt.js       # Prompt suggestions de correction
│       └── mrComment.prompt.js          # Prompt commentaire MR + risque
├── models/
│   ├── User.model.js
│   ├── Pipeline.model.js
│   ├── Analysis.model.js
│   ├── Vulnerability.model.js
│   ├── KnowledgeBase.model.js
│   ├── ProjectHealth.model.js
│   └── Incident.model.js
├── queues/
│   ├── queues.js                        # Définition des 3 files BullMQ
│   └── workers/
│       ├── pipelineAnalysis.worker.js   # Worker principal (5 concurrents)
│       ├── logCollection.worker.js      # Worker collecte logs (3 concurrents)
│       └── notification.worker.js       # Worker notifications (10 concurrents)
├── services/
│   ├── gitlab/
│   │   ├── gitlab.service.js            # API GitLab (pipelines, jobs, commits)
│   │   └── logCollection.service.js     # Agrégation des logs
│   ├── sonarqube/
│   │   └── sonarqube.service.js         # Récupération issues qualité
│   ├── trivy/
│   │   └── trivy.service.js             # Parsing rapports vulnérabilités
│   ├── normalizer/
│   │   └── normalizer.service.js        # Normalisation multi-sources
│   ├── correlation.service.js           # Corrélation GitLab/SonarQube/Trivy
│   ├── knowledgeBase.service.js         # Cache solutions + signatures
│   ├── healthScore.service.js           # Calcul score santé (6 métriques)
│   ├── mrComment.service.js             # Commentaires MR + score de risque
│   └── weeklyReport.service.js          # Génération rapports hebdomadaires
├── utils/
│   ├── logger.js                        # Winston (info, error, warn, http)
│   ├── httpClient.js                    # Axios avec retry automatique
│   └── retry.js                         # Wrapper backoff exponentiel
├── config/
│   ├── index.js                         # Configuration centralisée
│   ├── database.js                      # Connexion MongoDB
│   └── redis.js                         # Connexion Redis + BullMQ
├── socket.js                            # WebSocket Socket.io
├── app.js                               # Express app + middlewares
└── server.js                            # Point d'entrée HTTP
```

### 3.3 Flux de traitement principal

```
GitLab Pipeline terminé
        │
        ▼ Webhook HTTP POST (validé HMAC-SHA256)
Backend reçoit l'événement → 202 Accepted
        │
        ▼ BullMQ — file "pipeline-analysis" (3 retries, backoff exponentiel)
Worker asynchrone démarre
        │
        ├── Fetch logs GitLab CI (jobs échoués)
        ├── Fetch issues SonarQube (quality gate + bugs)
        ├── Fetch rapport Trivy (artifacts CI — CVEs)
        └── Fetch commits Git (auteur, message, diff)
        │
        ▼ Normalisation des données (normalizer.service.js)
Recherche dans la Knowledge Base (problème déjà résolu ?)
        │
        ├── [Cache HIT]  → Retourner solution mémorisée
        └── [Cache MISS] → Groq LLM — Analyse de cause racine
                               │
                               ▼ Sauvegarde MongoDB
                    Mise à jour Knowledge Base + Health Score
                               │
                               ▼ Commentaire automatique sur MR GitLab
                    Émission WebSocket → Dashboard mis à jour
                               │
                               ▼ Création automatique d'incident si critique
```

### 3.4 Architecture Frontend

```
src/
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── PipelinesPage.jsx
│   ├── PipelineDetail.jsx
│   ├── AnalysisPage.jsx
│   ├── SecurityPanel.jsx
│   ├── KnowledgeBase.jsx
│   ├── HealthScore.jsx
│   ├── WeeklyReport.jsx
│   ├── Incidents.jsx
│   └── Settings.jsx
├── components/
│   ├── layout/             # AppShell, Sidebar, Topbar, GlobalProjectFilter
│   ├── dashboard/          # MetricCard, FailureTrendChart, TopIssuesPanel
│   ├── analysis/           # AIInsightCard, ConfidenceIndicator, FixSuggestionList
│   ├── security/           # SeverityBadge, VulnerabilityTable
│   ├── knowledge/          # KnowledgeCard, SolutionDetail
│   ├── health/             # HealthScoreCard, ScoreBreakdown, ProjectComparison
│   ├── report/             # WeeklyReportCard, TeamMetrics
│   ├── incident/           # IncidentTimeline, WarRoomPanel
│   └── ui/                 # Card, Button, Badge, Spinner, EmptyState
├── api/                    # Clients HTTP (Axios + JWT interceptor)
├── hooks/                  # Hooks React Query personnalisés
├── store/                  # Redux Toolkit (auth, pipelines)
├── context/                # ProjectContext (filtre global projet)
└── styles/                 # CSS global + Tailwind
```

---

## 4. Stack Technologique

### 4.1 Backend

| Technologie | Version | Rôle |
|-------------|---------|------|
| Node.js | 20 LTS | Runtime JavaScript (ESM) |
| Express.js | 4.x | Framework API REST |
| MongoDB | 7.x | Base de données principale |
| Mongoose | 8.x | ODM MongoDB |
| Redis | 7.x | Cache et broker de messages |
| BullMQ | 5.x | Gestion des jobs asynchrones |
| Socket.io | 4.x | Communication temps réel |
| Groq SDK | latest | LLM primaire (llama3-70b-8192) |
| Anthropic SDK | latest | LLM secondaire (claude-sonnet-4) |
| JWT | 9.x | Authentification (access 15m + refresh 7j) |
| Bcrypt | 5.x | Hachage des mots de passe |
| Winston | 3.x | Logging structuré |
| Helmet | 7.x | Headers de sécurité HTTP |
| Express-rate-limit | 7.x | Limitation du débit |
| Axios | 1.x | Client HTTP avec retry |

### 4.2 Frontend

| Technologie | Version | Rôle |
|-------------|---------|------|
| React | 18.x | Framework UI |
| Vite | 5.x | Build tool + dev server |
| React Router | 6.x | Routage SPA |
| TanStack Query | 5.x | Gestion des états serveur + cache |
| Redux Toolkit | 2.x | État global (auth, filtres) |
| Tailwind CSS | 3.x | Stylisation utilitaire |
| Socket.io Client | 4.x | WebSocket temps réel |
| Recharts | 2.x | Graphiques et visualisations |
| Lucide React | 0.x | Bibliothèque d'icônes |
| date-fns | 3.x | Formatage des dates |
| Axios | 1.x | Client HTTP avec intercepteurs |

### 4.3 Infrastructure CI/CD (environnement de test)

| Composant | Description |
|-----------|-------------|
| GitLab CE | Serveur Git + CI/CD local (Vagrant VM, port 8929) |
| GitLab Runner | Exécution des pipelines (Docker executor) |
| SonarQube CE | Analyse qualité du code (port 9001) |
| Trivy | Scanner de vulnérabilités Docker (artifact CI) |
| Docker + Docker Compose | Conteneurisation de tous les services |
| Vagrant + VirtualBox | VM de développement isolée |
| Cloudflare Tunnel | Exposition du backend local pour les webhooks GitLab |

---

## 5. Fonctionnalités

### 5.1 Dashboard principal

- Vue synthétique : pipelines récents, taux de succès global, tendances sur 7 jours
- Indicateurs clés (KPIs) : nombre d'analyses, vulnérabilités critiques, score qualité moyen, MTTR
- Graphique d'évolution temporelle des échecs (Recharts)
- Top 5 des problèmes récurrents
- Notifications en temps réel via WebSocket
- Filtre global projet (multi-projet)

### 5.2 Gestion des Pipelines

- Liste paginée avec statut, durée, branche, projet, déclencheur
- Détail par pipeline : jobs, logs, durée par étape, analyse AI associée
- Re-déclenchement d'analyse manuelle (rôles admin/analyst)
- Historique et filtrage multi-critères
- Lien direct vers GitLab (webUrl)

### 5.3 Analyse AI — Root Cause Analysis

- **Type d'erreur** : `build_failure`, `test_failure`, `dependency_issue`, `security_vulnerability`, `configuration_error`, `unknown`
- **Cause racine** : explication en langage naturel générée par LLM
- **Niveau de risque** : `critical` / `high` / `medium` / `low`
- **Score de confiance** : 0–100% affiché visuellement
- **Suggestions de correction** priorisées par sévérité (avec commande et extrait de code)
- **Fichiers affectés** : liste des fichiers impliqués dans l'échec
- **Issues récurrentes** : détection des patterns répétitifs (Top 5)
- Marquage "résolu" par l'utilisateur (rôles admin/analyst)
- Temps de traitement affiché

### 5.4 Sécurité — Trivy

- Compteurs par sévérité : CRITICAL, HIGH, MEDIUM, LOW
- Liste détaillée des CVEs : package, version affectée, version corrigée, date de publication
- Statuts gérables : `open` / `fixed` / `ignored`
- Action "Ignorer" une vulnérabilité (rôles admin/analyst)
- Filtrage par sévérité, statut et projet
- Historique par pipeline et par projet

### 5.5 Qualité de Code — SonarQube

- Quality Gate : Passed / Failed
- Métriques : bugs, vulnérabilités, code smells, coverage des tests, duplications
- Intégration dans l'analyse AI (corrélation qualité ↔ cause racine)
- Visible dans le détail de chaque analyse

### 5.6 Base de Connaissances (Knowledge Base)

- Mémorisation automatique des solutions aux problèmes récurrents
- Signature unique par type d'erreur et pattern de log
- Champs par entrée : titre, cause racine, solution, commande, extrait de code, tags, projets concernés
- Statistiques : nombre d'utilisations, taux de succès, dernière utilisation
- Recherche full-text (titre, tags, solution)
- Réutilisation automatique lors d'une nouvelle analyse similaire (cache hit)
- Suppression manuelle (rôle admin uniquement)

### 5.7 Score de Santé Projet

- Score de 0 à 100, converti en grade (A à F) et tendance (↑ ↓ →)
- 6 métriques pondérées composant le score :
  - Taux de succès des pipelines
  - Densité de vulnérabilités critiques
  - Qualité du code SonarQube
  - Fréquence des incidents
  - Couverture de tests
  - Vitesse de résolution (MTTR)
- Historique sur 8 semaines (graphique d'évolution)
- Comparaison multi-projets côte à côte
- Recalcul forcé disponible (rôle admin)

### 5.8 Gestion des Incidents

- Création automatique d'incident lors d'une analyse critique
- Cycle de vie : `open` → `investigating` → `resolved`
- Timeline complète : chaque changement de statut horodaté avec auteur
- Ajout de commentaires à la timeline (rôles admin/analyst)
- MTTR calculé automatiquement (Mean Time To Resolve)
- Génération de post-mortem par IA (analyse de la chronologie, recommandations)
- Lien vers l'analyse AI associée et le pipeline concerné
- Filtrage par sévérité, statut, projet, assigné

### 5.9 Analyse de Risque — Merge Requests

- Score de risque de fusion calculé avant merge
- Commentaire automatique posté sur la MR GitLab avec résumé de l'analyse, niveau de risque et suggestions
- Basé sur : logs CI, issues SonarQube, vulnérabilités Trivy, historique du projet

### 5.10 Rapports Hebdomadaires

- Rapport généré automatiquement chaque semaine par projet/équipe
- Métriques agrégées : nombre de pipelines, taux de succès, vulnérabilités ouvertes, MTTR moyen
- Comparaison avec la semaine précédente (tendances)
- Accès aux rapports historiques par numéro de semaine

### 5.11 Sécurité de la Plateforme

- Authentification JWT : access token (15 min) + refresh token (7 jours)
- RBAC à 3 niveaux :
  - **admin** : toutes opérations (suppression, recalcul, configuration)
  - **analyst** : analyses, résolution, commentaires, post-mortems
  - **viewer** : lecture seule
- Validation HMAC-SHA256 des webhooks GitLab
- Rate limiting par endpoint
- Headers de sécurité HTTP (Helmet.js)
- Hachage Bcrypt des mots de passe
- Variables sensibles dans `.env` (jamais committées)

---

## 6. API REST — Endpoints

### 6.1 Authentification

```
POST   /api/auth/login                        # Connexion utilisateur
POST   /api/auth/refresh                      # Renouvellement du token
```

### 6.2 Webhooks

```
POST   /api/webhooks/gitlab                   # Réception événements pipeline GitLab
```

### 6.3 Pipelines

```
GET    /api/pipelines                         # Liste paginée + filtres
GET    /api/pipelines/stats                   # Statistiques dashboard (7 jours)
GET    /api/pipelines/:id                     # Détail pipeline + analyse
POST   /api/pipelines/:id/retry               # Re-déclencher analyse (admin/analyst)
```

### 6.4 Analyses

```
GET    /api/analyses                          # Analyses récentes (paginées, filtrables)
GET    /api/analyses/recurring                # Top 5 problèmes récurrents
GET    /api/analyses/:pipelineId              # Analyse d'un pipeline spécifique
PATCH  /api/analyses/:id/resolve              # Marquer comme résolu (admin/analyst)
```

### 6.5 Vulnérabilités

```
GET    /api/vulnerabilities                   # Liste (filtres sévérité/statut/projet)
PATCH  /api/vulnerabilities/:id/ignore        # Ignorer une vulnérabilité (admin/analyst)
```

### 6.6 Base de Connaissances

```
GET    /api/knowledge                         # Toutes les entrées (paginées)
GET    /api/knowledge/stats                   # Statistiques (total, cache hits)
GET    /api/knowledge/search                  # Recherche full-text
GET    /api/knowledge/:id                     # Entrée individuelle
DELETE /api/knowledge/:id                     # Supprimer une entrée (admin)
```

### 6.7 Score de Santé

```
GET    /api/health-score                      # Scores de tous les projets
GET    /api/health-score/:projectId           # Score d'un projet
GET    /api/health-score/:projectId/history   # Historique sur 8 semaines
POST   /api/health-score/compute-all          # Forcer le recalcul (admin)
```

### 6.8 Incidents

```
GET    /api/incidents                         # Liste (paginée, filtres multiples)
GET    /api/incidents/:id                     # Détail avec analyse liée
PATCH  /api/incidents/:id/status              # Mettre à jour le statut + timeline
POST   /api/incidents/:id/comment             # Ajouter un commentaire
POST   /api/incidents/:id/postmortem          # Générer post-mortem IA (admin/analyst)
```

### 6.9 Rapports Hebdomadaires

```
GET    /api/reports                           # Liste des semaines disponibles
GET    /api/reports/current                   # Rapport de la semaine courante
GET    /api/reports/:weekOffset               # Rapport d'une semaine passée
```

---

## 7. Modèles de Données

### 7.1 User
```json
{
  "email": "string (unique)",
  "passwordHash": "string (bcrypt)",
  "name": "string",
  "role": "admin | analyst | viewer",
  "isActive": "boolean",
  "lastLoginAt": "Date"
}
```

### 7.2 Pipeline
```json
{
  "pipelineId": "number (GitLab ID)",
  "projectId": "number",
  "projectName": "string",
  "ref": "string (branche)",
  "status": "success | failed | cancelled | running",
  "failedJobs": ["string"],
  "triggeredBy": "string",
  "duration": "number (secondes)",
  "webUrl": "string",
  "createdAt": "Date",
  "finishedAt": "Date"
}
```

### 7.3 Analysis
```json
{
  "pipelineId": "ObjectId (ref Pipeline)",
  "projectId": "number",
  "errorType": "build_failure | test_failure | dependency_issue | security_vulnerability | configuration_error | unknown",
  "rootCause": "string",
  "summary": "string",
  "confidence": "number (0–1)",
  "riskLevel": "critical | high | medium | low",
  "suggestedFixes": [{ "description": "string", "severity": "string", "command": "string", "codeHint": "string" }],
  "affectedFiles": ["string"],
  "resolved": "boolean",
  "processingTime": "number (ms)",
  "mttr": "number (minutes)",
  "rawData": { "logsSample": "string", "sonarIssuesCount": "number", "vulnCount": "number" }
}
```

### 7.4 Vulnerability
```json
{
  "projectId": "number",
  "pipelineId": "ObjectId (ref Pipeline)",
  "cveId": "string",
  "packageName": "string",
  "severity": "CRITICAL | HIGH | MEDIUM | LOW",
  "title": "string",
  "description": "string",
  "fixedVersion": "string",
  "publishedDate": "Date",
  "status": "open | fixed | ignored"
}
```

### 7.5 KnowledgeBase
```json
{
  "errorSignature": "string (hash unique du pattern)",
  "errorType": "string",
  "title": "string",
  "rootCause": "string",
  "solution": "string",
  "command": "string",
  "codeHint": "string",
  "tags": ["string"],
  "projectIds": ["number"],
  "usedCount": "number",
  "successRate": "number (0–1)",
  "lastUsed": "Date"
}
```

### 7.6 ProjectHealth
```json
{
  "projectId": "number",
  "projectName": "string",
  "score": "number (0–100)",
  "grade": "A | B | C | D | E | F",
  "trend": "up | down | stable",
  "breakdown": {
    "pipelineSuccessRate": "number",
    "criticalVulnerabilities": "number",
    "codeQuality": "number",
    "incidentFrequency": "number",
    "testCoverage": "number",
    "mttr": "number"
  },
  "weekHistory": [{ "week": "string", "score": "number" }],
  "computedAt": "Date"
}
```

### 7.7 Incident
```json
{
  "incidentId": "string (UUID)",
  "title": "string",
  "projectId": "number",
  "pipelineId": "ObjectId (ref Pipeline)",
  "analysisId": "ObjectId (ref Analysis)",
  "severity": "critical | high | medium | low",
  "status": "open | investigating | resolved",
  "detectedAt": "Date",
  "resolvedAt": "Date",
  "mttr": "number (minutes)",
  "assignedTo": "string",
  "timeline": [{ "timestamp": "Date", "author": "string", "action": "string", "comment": "string" }],
  "postMortem": { "generatedAt": "Date", "content": "string", "recommendations": ["string"] }
}
```

---

## 8. Interfaces Utilisateur

### 8.1 Pages de l'application

| Page | Route | Description |
|------|-------|-------------|
| **Login** | `/login` | Authentification sécurisée (JWT) |
| **Dashboard** | `/dashboard` | KPIs, tendances 7 jours, top issues |
| **Pipelines** | `/pipelines` | Liste paginée avec filtres multi-critères |
| **Détail Pipeline** | `/pipelines/:id` | Analyse complète d'un pipeline |
| **AI Analysis** | `/analysis` | Toutes les analyses, filtres statut/risque |
| **Security** | `/security` | Vulnérabilités Trivy avec gestion des statuts |
| **Knowledge Base** | `/knowledge` | Solutions mémorisées, recherche full-text |
| **Health Score** | `/health` | Score santé par projet, comparaison, historique |
| **Incidents** | `/incidents` | Gestion incidents, timeline, post-mortems |
| **Weekly Report** | `/reports` | Rapports hebdomadaires agrégés |
| **Settings** | `/settings` | Configuration utilisateur et plateforme |

---

## 9. Sécurité et Performance

### 9.1 Sécurité

- Webhooks signés avec HMAC-SHA256 (header `X-Gitlab-Token`)
- Tokens JWT : access token 15 min + refresh token 7 jours
- RBAC à 3 niveaux (admin / analyst / viewer) sur tous les endpoints sensibles
- Hachage Bcrypt pour les mots de passe
- Variables sensibles dans `.env` (jamais committées)
- Validation et assainissement des entrées sur tous les endpoints publics
- Headers de sécurité HTTP (Helmet : CSP, HSTS, X-Frame-Options...)
- Rate limiting différencié par endpoint

### 9.2 Performance

- Traitement asynchrone via BullMQ : découplage immédiat webhook/analyse (202 Accepted)
- 3 files de jobs indépendantes : pipeline-analysis (×5), log-collection (×3), notifications (×10)
- Retry automatique avec backoff exponentiel (3 tentatives)
- Cache Redis pour les sessions et la file de messages
- Base de connaissances : évite les appels LLM répétitifs sur les problèmes connus
- WebSocket Socket.io : élimine le polling frontend
- React Query : cache côté client avec invalidation sélective

---

## 10. Environnement de Développement

### 10.1 Prérequis

- Windows 11 + VirtualBox + Vagrant
- Node.js 20 LTS
- Docker Desktop (ou Redis/MongoDB natifs)
- GitLab CE sur VM Vagrant (port 8929)
- SonarQube CE (port 9001)
- Cloudflare Tunnel (exposition webhooks)

### 10.2 Variables d'environnement

```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/aiops
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=<secret-long-et-aléatoire>
GITLAB_URL=https://gitlab.com
GITLAB_TOKEN=glpat-xxxxxxxxxxxx
GITLAB_WEBHOOK_SECRET=<secret-webhook>
SONARQUBE_URL=http://localhost:9001
SONARQUBE_TOKEN=<token-sonar>
GROQ_API_KEY=gsk-xxxxxxxxxxxx
GROQ_MODEL=llama3-70b-8192
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
FRONTEND_URL=http://localhost:5173
```

### 10.3 Démarrage

```bash
# Backend (port 3001)
cd aiops-platform/backend && npm install && npm run dev

# Frontend (port 5173)
cd aiops-platform/frontend && npm install && npm run dev

# Exposition des webhooks GitLab
cloudflared tunnel --url http://localhost:3001

# Stack complète via Docker
docker-compose up -d
```

---

## 11. Résultats Obtenus

| Indicateur | Résultat |
|------------|---------|
| Temps d'analyse AI | < 10 secondes après réception du webhook |
| Précision de détection du type d'erreur | ~85% sur les cas testés |
| Intégration GitLab CI | ✅ Fonctionnelle (webhooks + API) |
| Intégration SonarQube | ✅ Fonctionnelle (quality gate + issues) |
| Intégration Trivy | ✅ Fonctionnelle (artifacts CI) |
| Temps réel WebSocket | ✅ Fonctionnel |
| Authentification JWT + RBAC (3 rôles) | ✅ Fonctionnel |
| Base de connaissances | ✅ Fonctionnelle (cache hit automatique) |
| Score de santé projet (grades A–F) | ✅ Fonctionnel (6 métriques pondérées) |
| Gestion des incidents + post-mortems IA | ✅ Fonctionnel |
| Rapports hebdomadaires | ✅ Fonctionnels |
| Analyse risque Merge Requests | ✅ Fonctionnelle (commentaire automatique) |
| Support multi-projets | ✅ Fonctionnel (filtre global) |

---

## 12. Évolutions Futures

- **Alertes email/Slack/PagerDuty** : Notifications actives sur incidents critiques (worker notifications déjà structuré)
- **ML prédictif** : Prédiction de probabilité d'échec avant exécution du pipeline
- **Support Jenkins / GitHub Actions** : Extension aux autres plateformes CI/CD
- **SLA et on-call management** : Escalade automatique selon les délais de résolution
- **Tableau de bord exécutif** : Vue agrégée multi-équipes pour le management
- **Export PDF** : Rapports hebdomadaires et post-mortems en format imprimable

---

## 13. Conclusion

La plateforme AIOps développée dans le cadre de ce PFE répond à une problématique concrète rencontrée dans les équipes DevOps modernes. Elle va au-delà du simple diagnostic de pipeline en constituant un véritable système d'intelligence opérationnelle : analyse automatisée de cause racine, base de connaissances auto-alimentée, score de santé continu, gestion des incidents de bout en bout et rapports hebdomadaires agrégés.

Le projet démontre l'apport de l'intelligence artificielle (Llama 3 70B via Groq, avec Claude en backup) dans l'automatisation des tâches DevOps répétitives, en combinant des technologies éprouvées (Node.js, React, MongoDB, BullMQ, Redis) avec des pratiques d'ingénierie robustes (RBAC, HMAC, retry exponentiel, file de jobs asynchrones).

La solution couvre l'intégralité du cycle opérationnel : collecte des données, corrélation multi-sources, analyse intelligente, apprentissage des patterns, pilotage de la santé projet et restitution en temps réel — constituant une plateforme complète, extensible et prête pour un usage en production.

---

*Document rédigé dans le cadre d'un Projet de Fin d'Études (PFE) — Mis à jour en mai 2026*
