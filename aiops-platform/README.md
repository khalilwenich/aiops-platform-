# AIOps Platform

Production-ready AIOps platform that receives GitLab CI/CD pipeline failure events, performs AI-powered root cause analysis via Claude, and displays real-time insights in a modern React dashboard.

## Architecture

```
aiops-platform/
├── backend/          Node.js 20 + Express + BullMQ + Claude AI
├── frontend/         React 18 + Vite + Tailwind + Redux + React Query
└── docker-compose.yml
```

## Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Node.js 20 ESM, Express 4 |
| Database | MongoDB 7 (Mongoose 8) |
| Queue | Redis 7 + BullMQ 5 |
| AI | Anthropic Claude (claude-sonnet-4-20250514) |
| Real-time | Socket.io 4 |
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| State | Redux Toolkit + TanStack Query |
| Auth | JWT (access 15m + refresh 7d) |

## Quick Start

### 1. Configure environment

```bash
cp .env .env.local
# Edit .env with your real tokens:
#   ANTHROPIC_API_KEY=sk-ant-...
#   GITLAB_TOKEN=glpat-...
#   GITLAB_WEBHOOK_SECRET=your-secret
#   JWT_SECRET=long-random-string
```

### 2. Start with Docker Compose

```bash
cd aiops-platform
docker compose up -d
```

### 3. Create admin user

```bash
docker compose exec backend node src/scripts/seed.js
# Admin: admin@aiops.local / Admin@123456
```

### 4. Open the dashboard

http://localhost:5173

## Local Development (no Docker)

### Backend

```bash
cd backend
cp ../.env .env
npm install
npm run dev   # starts on :3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev   # starts on :5173
```

## GitLab Webhook Setup

1. In your GitLab project: Settings → Webhooks
2. URL: `http://your-server:3001/api/webhooks/gitlab`
3. Secret token: value of `GITLAB_WEBHOOK_SECRET`
4. Trigger: **Pipeline events** (check)
5. Click **Add webhook**

Every pipeline failure will now automatically trigger AI root cause analysis.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/webhooks/gitlab` | GitLab webhook receiver |
| GET | `/api/pipelines` | List pipelines (paginated) |
| GET | `/api/pipelines/stats` | Dashboard stats |
| GET | `/api/pipelines/:id` | Pipeline + analysis |
| POST | `/api/pipelines/:id/retry` | Re-trigger analysis |
| GET | `/api/analyses` | Recent analyses |
| GET | `/api/analyses/recurring` | Top recurring issues |
| PATCH | `/api/analyses/:id/resolve` | Mark resolved |
| GET | `/api/health` | Health check |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Claude API key | Yes |
| `GITLAB_TOKEN` | GitLab personal access token | Yes |
| `GITLAB_WEBHOOK_SECRET` | Shared secret for webhook validation | Yes |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `REDIS_HOST` | Redis host | Yes |
| `SONARQUBE_URL` | SonarQube base URL | Optional |
| `SONARQUBE_TOKEN` | SonarQube API token | Optional |
