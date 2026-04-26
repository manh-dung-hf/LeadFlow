# LeadFlow AI — Intelligent Multi-Channel Sales & CRM Platform

LeadFlow AI is a production-ready CRM and lead processing system powered by local AI (Ollama). It helps sales teams manage leads from multiple channels like Telegram, WhatsApp, Zalo, and Alibaba with AI-driven insights and automation.

## Features
- **AI Processing**: Automated classification, temperature detection, and response suggestion using Ollama.
- **Multi-Channel**: Integration config for Telegram, WhatsApp, and Zalo.
- **Smart Knowledge Base**: Semantic search using embeddings to link products to leads.
- **Kanban Pipeline**: Modern drag-and-drop style lead management.
- **SLA Tracking**: Real-time response time monitoring and alerts.
- **Modern Dashboard**: Analytics and KPI visualization with Recharts.

## Tech Stack
- **Backend**: Flask, PostgreSQL, Redis, Celery.
- **Frontend**: React, TailwindCSS, Vite, TanStack Query.
- **AI**: Ollama (llama3, nomic-embed-text).

## Setup Instructions

### 1. Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL & Redis (or Docker)
- [Ollama](https://ollama.com/) installed and running locally.

### 2. Ollama Models
Download the required models:
```bash
ollama pull llama3
ollama pull nomic-embed-text
```

### 3. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python seed.py  # Initialize DB and seed sample data
python run.py
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 5. Docker Setup (Alternative)
```bash
docker-compose up --build
```

## Default Credentials
- **Admin**: `admin@leadflow.ai` / `admin123`
- **Sales**: `sales@sales.ai` / `sales123`

---
Built with ❤️ by Antigravity AI Architect.
