# FinanceTracker – PantherLedger

A full-stack personal finance tracker with a Python FastAPI backend and a React frontend.

---

## Prerequisites

Make sure the following are installed on your machine before getting started:

| Tool | Version | Download |
|---|---|---|
| Python | 3.10+ | https://www.python.org/downloads/ |
| Node.js | 18+ | https://nodejs.org/ |
| Git | any | https://git-scm.com/ |

You will also need access to a **MongoDB Atlas** cluster. Contact a team member for credentials.

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_ORG/FinanceTracker.git
cd FinanceTracker
```

---

### 2. Configure the database

Copy the example env file and fill in your MongoDB credentials:

```bash
cp app/db/.env.example app/db/.env
```

Open `app/db/.env` and replace the placeholder values:

```
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/?retryWrites=true&w=majority
```

> Contact a team member if you don't have MongoDB credentials.

---

### 3. Set up the Python backend

From the project root, create a virtual environment and install dependencies:

```bash
# Create virtual environment
python -m venv venv

# Activate it
# macOS / Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

---

### 4. Set up the React frontend

```bash
cd frontend/pantherledger
npm install
cd ../..
```

---

## Running the App

You need **two terminals** running at the same time.

### Terminal 1 — Backend

From the project root (with venv active):

```bash
source venv/bin/activate   # skip if already active
uvicorn app.api:app --reload
```

The API will be running at **http://localhost:8000**.  
You can verify it's working by visiting http://localhost:8000/health.

### Terminal 2 — Frontend

```bash
cd frontend/pantherledger
npm run dev
```

The app will be running at **http://localhost:5173**.

---

## First-Time Use

1. Open **http://localhost:5173** in your browser.
2. Click **Register** and create a new account.
3. Log in and start tracking your finances.

---

## Project Structure

```
FinanceTracker/
├── app/
│   ├── api.py          # FastAPI entry point
│   ├── db/             # Database connection & .env
│   └── routers/        # Auth, expenses, categories, analytics
├── frontend/
│   └── pantherledger/  # React + Vite frontend
├── requirements.txt
└── main.py             # Optional CLI for testing
```

---

## Tech Stack

- **Backend**: Python, FastAPI, PyMongo
- **Frontend**: React 19, Vite, React Router
- **Database**: MongoDB Atlas
