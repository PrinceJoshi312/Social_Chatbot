# 🤖 Multi-Platform Business Chatbot (WhatsApp-First)

A beginner-friendly AI chatbot platform for businesses that works on **WhatsApp** and can be extended to **Telegram, Instagram, Web Chat, and more**.

This project allows businesses to upload their data and instantly get an **AI assistant** that answers customer questions, captures leads, and automates replies.

---

# ✨ Features

* 💬 WhatsApp-first chatbot (extendable to all messaging apps)
* 🧠 RAG-based knowledge system (answers from business documents)
* 🏢 Multi-business (multi-tenant) support
* ⚙️ Admin panel for customization
* 📄 Upload PDFs, FAQs, or website content
* 🔍 Vector search for accurate responses
* 🧩 Modular adapter architecture
* 🔒 Private local LLM support using Ollama

---

# 🧠 How It Works

1. Customer sends message on WhatsApp
2. Message reaches chatbot server
3. System identifies the business
4. RAG retrieves relevant company data
5. LLM generates response
6. Reply sent back to user

---

# 🏗️ Project Architecture

```
Messaging Apps (WhatsApp, Telegram, Web)
                │
                ▼
        Platform Adapters
                │
                ▼
            API Server
                │
        ┌───────┴────────┐
        ▼                ▼
     Chat Engine     Admin Panel
        │
        ▼
       RAG
        │
        ▼
   Vector Database
        │
        ▼
      Ollama LLM
```

---

# 🛠 Tech Stack

### Backend

* Python (FastAPI)
* LangChain / LlamaIndex
* Ollama (Local LLM)
* Qdrant / Chroma (Vector DB)

### Frontend (Admin Panel)

* React
* Tailwind CSS

### Messaging Integrations

* WhatsApp Business API / Twilio
* Telegram Bot API
* Web Chat Widget

---

# 📁 Folder Structure

```
business-chatbot/
│
├── backend/
│   ├── adapters/
│   │   ├── whatsapp.py
│   │   ├── telegram.py
│   │   └── webchat.py
│   │
│   ├── rag/
│   ├── llm/
│   ├── routers/
│   └── database/
│
├── admin-panel/
│   ├── frontend/
│   └── backend/
│
├── worker/
│   └── embedding_jobs.py
│
└── docker-compose.yml
```

---

# 🚀 Getting Started (Beginner Setup)

### 1. Clone Repository

```
git clone https://github.com/yourusername/business-chatbot.git
cd business-chatbot
```

### 2. Install Dependencies

```
pip install -r requirements.txt
```

### 3. Install Ollama

Download and install Ollama, then run:

```
ollama run llama3
```

### 4. Start Backend Server

```
uvicorn main:app --reload
```

Server will start at:

```
http://localhost:8000
```

---

# 📚 RAG Workflow

1. Upload documents
2. Convert to chunks
3. Generate embeddings
4. Store in vector DB
5. Retrieve relevant chunks
6. Send to LLM for answer

---

# ⚙️ Admin Panel Features

Each business can:

* Upload documents
* Add FAQs
* Customize chatbot tone
* Set working hours
* Configure fallback human number
* View chat analytics

---

# 🧩 Multi-Tenant Design

Every request contains:

```
{
  "business_id": "123",
  "user_id": "987",
  "message": "What are your prices?"
}
```

This ensures data isolation between businesses.

---

# 💬 Messaging Adapter Example

Each platform converts incoming message to standard format:

```
{
  "user_id": "user123",
  "business_id": "biz001",
  "message": "Hello",
  "platform": "whatsapp"
}
```

---

# 📦 MVP Roadmap

### Phase 1

* Single business chatbot
* Basic RAG

### Phase 2

* WhatsApp integration
* Multi-business support

### Phase 3

* Admin panel
* Document upload

### Phase 4

* Analytics dashboard
* Lead detection

---

# 🎯 Use Cases

* Coaching institutes
* Hospitals
* Restaurants
* Real estate agencies
* E-commerce stores
* Salons & local businesses

---

# 🔮 Future Improvements

* Voice message support
* Auto website scraping
* CRM integrations
* Payment integration
* Human handover mode
* Memory for returning users

---

# 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

---

# 📜 License

MIT License

---

# 🙌 Acknowledgements

* Ollama
* LangChain
* LlamaIndex
* FastAPI
* React

---

# ⭐ If you like this project

Give it a star and help others discover it!
