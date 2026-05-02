# Production Deployment - Worker Architecture

This system uses a **decoupled worker architecture** to handle website crawling safely without hitting request timeouts.

## 1. AI Architecture (Gemini-First)
This system defaults to **Google Gemini** for high-performance AI responses. **Ollama** is supported as an optional self-hosted provider.

### Required Environment Variables
| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string. |
| `CRON_SECRET` | Secret token to secure the cron trigger. |
| `AI_PROVIDER` | `gemini` (default) or `ollama`. |
| `GEMINI_API_KEY` | Server-level Gemini API Key (fallback). |
| `API_KEY_ENCRYPTION_SECRET` | **REQUIRED** for storing user API keys. (32-byte base64 string). |
| `OLLAMA_BASE_URL` | URL for the Ollama API (if using Ollama mode). |

## 2. API Key Protection
User-provided API keys are **encrypted at rest** using Fernet (AES-256). To enable this:
1. Generate a key: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`
2. Add the output to your `API_KEY_ENCRYPTION_SECRET` env var.
3. If this secret is missing, user API key storage is disabled for safety.

## 3. Process Commands (Railway/Render)
The provided `Procfile` handles these automatically:

**Web API:**
```bash
cd backend && alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**Background Worker:**
```bash
cd backend && python -m app.workers.crawl_worker
```

## 4. Database Migrations
If you make changes to models, generate a new migration locally:
```bash
cd backend
..\venv\Scripts\python.exe -m alembic revision --autogenerate -m "description"
```
The migration files in `backend/migrations/versions` MUST be committed to Git.

## 3. Automated Scheduling (The Cron Trigger)
To automate crawling, use a scheduler (like Railway's built-in cron or GitHub Actions) to hit the following endpoint:

- **Endpoint:** `POST /api/cron`
- **Header:** `Authorization: Bearer <YOUR_CRON_SECRET>`

This endpoint **only creates jobs** in the database. It does NOT do the crawling. The background worker will pick them up automatically.

## 4. Admin & Debugging
You can monitor and manage jobs using these endpoints (require `Bearer <CRON_SECRET>`):

- `GET /api/cron/jobs`: List all recent jobs and their status.
- `GET /api/cron/jobs/{id}`: Get full error logs for a specific job.
- `POST /api/cron/jobs/{id}/retry`: Manually reset a failed job for retry.

## 5. Change Detection
The crawler includes **Content Hashing**. If a website's content has not changed since the last crawl:
1. The job status will be marked as `skipped`.
2. No re-indexing or PDF generation will occur.
3. This saves bandwidth and AI processing costs.

## 6. Development / Local Testing
To run the worker locally:
```powershell
# Open a new terminal
cd backend
..\venv\Scripts\python.exe -m app.workers.crawl_worker
```
