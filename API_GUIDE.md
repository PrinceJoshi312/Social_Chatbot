# WhatsApp RAG Bot - API & Integration Guide

This document provides a comprehensive overview of the system architecture, API endpoints, and integration steps for the WhatsApp RAG Bot.

## 1. System Architecture
- **Backend:** FastAPI (Python)
- **Frontend:** React (Vite/TypeScript)
- **Database:** SQLite/PostgreSQL (SQLAlchemy)
- **Vector Store:** FAISS (Local per-tenant)
- **AI Engine:** Ollama (Local LLM) + HuggingFace Embeddings
- **Messaging:** WhatsApp Business API (Direct Graph API integration)

---

## 2. API Reference

### Knowledge Base & RAG
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/businesses/` | `POST` | Create a new business tenant. |
| `/api/businesses/` | `GET` | List all business tenants. |
| `/api/upload/` | `POST` | Upload a PDF/TXT file and index it for RAG. |
| `/api/query/` | `POST` | Query the RAG engine and get an AI response. |
| `/api/documents/` | `GET` | List indexed documents for a business. |

### WhatsApp Webhook
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/whatsapp/webhook` | `GET` | Meta Webhook Verification (hub.challenge). |
| `/api/whatsapp/webhook` | `POST` | Receive and process incoming WhatsApp messages. |

### Analytics & Stats
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/analytics/stats/{biz_id}` | `GET` | Fetch aggregated usage and tool metrics. |

---

## 3. Agentic Tools (JSON Schema)
The bot can execute the following tools by outputting `TOOL_CALL: name(args)`.

### `get_order_status`
- **Purpose:** Check real-time order status in the DB.
- **Input:** `{"order_number": "string"}`

### `create_booking`
- **Purpose:** Schedule a new appointment.
- **Input:** `{"name": "string", "time": "YYYY-MM-DD HH:MM", "service": "string"}`

### `get_bookings`
- **Purpose:** Retrieve appointments for a specific customer.
- **Input:** `{"name": "string"}`

---

## 4. Environment Configuration
Required variables in `.env`:
```bash
# Database & Storage
DATABASE_URL=sqlite:///./sql_app.db
VECTOR_STORE_DIR=storage/vectors
UPLOAD_DIR=storage/uploads

# AI Settings
OLLAMA_BASE_URL=http://localhost:11434
LLM_MODEL=llama3
CHUNK_STRATEGY=semantic

# WhatsApp Integration
WHATSAPP_TOKEN=your_permanent_access_token
WHATSAPP_PHONE_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=whatsapp_bot_verify_token
```

---

## 5. Deployment Steps
1. **Start Ollama:** Ensure the local model is pulled and running.
2. **Launch Backend:** `uvicorn app.main:app --reload`
3. **Seed Data:** Run `python seed_db.py` and `python seed_orders.py`.
4. **Launch Frontend:** `npm run dev`
5. **Webhook Exposure:** Use `ngrok http 8000` for Meta integration testing.
