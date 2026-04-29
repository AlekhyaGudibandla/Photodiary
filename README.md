# 📸 Photodiary: AI-Powered Life Companion

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-v20+-blue.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-v18-61DAFB.svg)](https://reactjs.org/)
[![AI Powered](https://img.shields.io/badge/AI-Groq%20%7C%20Gemini-orange.svg)](https://groq.com/)

Photodiary is a **privacy-first AI journaling platform** that transforms daily reflections into structured insights using LLMs. It combines real-time interaction, asynchronous AI processing, and structured storage to create a system that is both responsive and scalable.

Unlike traditional journaling apps, Photodiary is designed as a **hybrid real-time + background processing system**, ensuring that AI workloads never degrade user experience.

---

## 🌟 Key Features

### 🧠 Empathic AI Companion
- **Real-time Voice/Text Chat**: Multi-turn conversational interface with persistent context using WebSockets.
- **Automated Journaling**: AI converts conversations into structured, readable diary entries with tone-aware summarization.

---

### 📊 Deep Insights & Analytics
- **Mood Tracking**: Visualizes emotional trends over 14 and 30-day rolling windows.
- **Tag Cloud & Patterns**: Automatic semantic tagging (e.g., productivity, health, stress).
- **Streak Management**: Tracks journaling consistency to encourage habit formation.

---

### 📁 Advanced Memory Management
- **Smart Collections**: Organize entries into albums with generated previews.
- **Global Search**: Full-text search across all entries.
- **Bucket List & Goals**: Integrated long-term tracking alongside daily logs.

---

### 🔐 Security
- **JWT Authentication**: Stateless session management.
- **Bcrypt Hashing**: Secure password storage.
- **Input Sanitization & XSS Protection**
- **Privacy First**: Entries are private by default.

---

## 🏗️ Technical Architecture

```mermaid
graph TD
    User((User)) -->|HTTPS/WSS| FE[React Frontend]
    FE -->|API Requests| BE[Node.js / Express API]
    BE -->|Query| DB[(PostgreSQL / Prisma)]
    BE -->|Job Queue| REDIS[(BullMQ / Redis)]
    REDIS -->|Process| Worker[AI Background Worker]
    Worker -->|LLM API| Groq[Groq / Llama 3]
    Worker -->|Vision API| Gemini[Google Gemini]
    BE -->|Upload| Cloud[Cloudinary Media Store]
````

---

## ⚙️ Key Engineering Decisions

### Async AI Processing (BullMQ + Redis)

AI inference is latency-heavy and can vary significantly in response time. To prevent blocking API responses:

* User requests are processed synchronously only for persistence
* AI-related tasks are offloaded to a Redis-backed queue (BullMQ)
* Background workers handle:

  * summarization
  * tag extraction
  * mood analysis

This design ensures:

* low response latency for user actions
* fault-tolerant processing with retries
* ability to scale workers independently

---

### Real-Time + Async Hybrid System

* **Socket.io** handles real-time chat and streaming responses
* **BullMQ workers** handle post-processing asynchronously

This separation allows:

* instant interaction during conversations
* heavy computation without degrading UX

---

### Modular Backend Architecture

Backend is structured into clear layers:

* Controllers → request/response handling
* Services → business logic
* Queue layer → async job orchestration
* Prisma → database access

This improves:

* maintainability
* extensibility of AI features
* testability

---

### Data Layer Design

* PostgreSQL for structured relational data
* Indexed fields for efficient querying (search, analytics)
* Prisma ORM for type safety and faster development

---

## 🔄 Data Flow

1. User creates an entry or sends a message
2. API stores data in PostgreSQL
3. AI job is enqueued in Redis
4. Worker processes:

   * summarization
   * tagging
   * insights extraction
5. Results are persisted and reflected in UI

---

## 💻 Technology Stack

### Frontend

* React 18, Vite
* TailwindCSS (Glassmorphism UI)
* Framer Motion
* Lucide Icons

### Backend

* Node.js, Express
* Socket.io (real-time communication)
* BullMQ (background processing)

### Database & Infra

* PostgreSQL with Prisma ORM
* Redis (queue + caching layer)
* Cloudinary (media storage & optimization)

### AI/ML

* Groq SDK (LLM inference)
* Google Gemini (vision tasks)

### Security

* Helmet.js
* Bcrypt
* JWT
* XSS Filters

---

## 🚀 Getting Started

### Prerequisites

* Node.js (v20 or higher)
* PostgreSQL instance
* Redis (for background AI processing)
* Groq & Google Cloud API Keys

---

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/your-username/Photodiary.git
cd Photodiary
```

2. **Backend Setup**

```bash
cd diary_backend
npm install
cp .env.example .env

# Add:
# DATABASE_URL=
# REDIS_URL=
# GROQ_API_KEY=
# GEMINI_API_KEY=
# CLOUDINARY_*

npx prisma generate
npx prisma migrate dev
npm run dev
```

3. **Frontend Setup**

```bash
cd ../frontend
npm install
npm run dev
```

---

## ☁️ Deployment

Recommended:

* Frontend → Vercel
* Backend → Render / Fly.io
* Database → Neon / Supabase
* Redis → Upstash

For full setup, see `deployment_guide.md`.

---

## 🛠️ Roadmap

* [ ] Mobile App (React Native)
* [ ] Advanced Vision (image → narrative)
* [ ] Multi-lingual AI support
* [ ] End-to-End Encryption (E2EE)

---

## 💭 What This Project Demonstrates

* Designing asynchronous systems using queues and workers
* Handling AI workloads without blocking user experience
* Building real-time + background hybrid architectures
* Structuring scalable backend systems with clear separation of concerns


---

Built with a focus on combining AI systems, scalable backend design, and real-world usability.
