# Adgentic AI

> AI-powered growth engine for business owners to generate, deploy, and track high-converting social ads.

---

## Architecture
<img width="732" height="350" alt="Screenshot 2026-02-07 at 3 40 45 PM" src="https://github.com/user-attachments/assets/159dc873-8bcc-4c50-a8f4-f942d60e95d6" />

Our project uses a **Micro-services Architecture** to separate high-performance data processing from user-facing interfaces. We have chosen to use one repository with multiple folders which you could think of as almost being their own repos within the larger repo, each carrying out a specific service.

### Backend Services

- **API Gateway** (Node.js/TypeScript): The central entry point for all client requests, managing authentication and routing.
- **Upload Services** (Node.js/TypeScript): Handles the secure intake of business customer data and brand assets.
- **Job Scheduling** (Python/FastAPI): Manages the timing and orchestration of complex ad generation tasks.
- **Task Processing** (Python/FastAPI + Celery): The core engine for AI ad generation and customer profiling.
- **Click Processor** (Node.js/TypeScript): Lightweight service dedicated to real-time tracking of ad engagement.
- **Analytics** (Python/FastAPI): Processes large datasets to provide actionable insights for the business dashboard.

### Frontend

- **Business Dashboard** (Next.js): Primary interface for business owners to manage campaigns and view growth metrics.
- **Consumer/client Pages** (Next.js): Public-facing landing pages and ad-hosting environments.
- **Admin Panel** (Next.js): Internal tool for system monitoring and ad moderation.

---

## Tech Stack

- **Languages:** TypeScript, Python
- **Frameworks:** React (Next.js), Express/NestJS, FastAPI
- **Data Processing:** Celery for distributed task queues

---

## Setup

1. **Clone the Repositories:**
   ```bash
   git clone https://github.com/dartmouth-cs98/project-ad-gentic-ai.git
   ```
2. **Frontend Installation:**
   ```bash
   cd frontend && npm install && npm run dev
   ```
3. **Backend Installation:**
   - **Python Services:**
     ```bash
     cd backend && pip install -r requirements.txt && python3 main.py
     ```
   - **Node Services:**
     ```bash
     cd backend-node && npm install
     ```
4. **Environment Variables:** Copy `.env.example` to `.env` in each service directory and fill in your local credentials.

---

## Quick Start (Docker)

We use Docker to containerize our application. 

**Prerequisites:**
- Docker Desktop installed
- Make (optional, but recommended for simplicity)

**Commands:**

1.  **Start Everything:**
    ```bash
    make up
    ```
    - Backend: http://localhost:8000
    - Frontend: http://localhost:3000

2.  **Stop Everything:**
    ```bash
    make down
    ```

3.  **Rebuild Containers:**
    ```bash
    make build
    ```

4.  **View Logs:**
    ```bash
    make logs
    ```

5.  **Run Independently:**
    - Backend only: `make backend`
    - Frontend only: `make frontend`

---

## Deployment

Deployment strategies and production environment configurations are currently being finalized.

---

## 👥 Authors

- **Kevin Guo**
- **Dickson Alexander**
- **Isaac Cheon**
- **Emmanuel Makau**
- **Arshdeep Singh**

---

## Acknowledgments

Developed as part of the **Dartmouth CS98 Senior Design and Implementation** course.
