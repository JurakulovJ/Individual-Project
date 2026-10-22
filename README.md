# TravelAI Platform ✈️🌍

> **AI-Powered Travel Planning and Decision-Support Web Application**  
> Final-Year Project Monorepo

---

## 🏛 Project Architecture

TravelAI is designed with a modern decoupled monorepo architecture:
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Axios, React Router DOM
- **Backend**: Python 3.10+ (tested on Python 3.13), FastAPI (REST API), SQLAlchemy (ORM), Pydantic v2 (Data Validation), Uvicorn (ASGI)
- **AI Engine**: Google GenAI (`google-genai`) & OpenAI SDK for natural language constraint extraction and dynamic itinerary synthesis
- **Data & Adapters**: Pluggable provider architecture with built-in Mock mode (works offline without API keys), Amadeus Travel API, and Google Places & Maps

---

## 📂 Monorepo Structure

```text
travelai-platform/
├── .gitignore
├── .env.example              # Sample environment configuration
├── README.md                 # Complete project guide & run instructions
├── docs/                     # Architectural documents & UI/data contracts
│   ├── ARCHITECTURE.md
│   └── UI_DATA_CONTRACT.md
├── backend/                  # FastAPI Application
│   ├── .env                  # Backend environment settings
│   ├── requirements.txt      # Python dependencies
│   ├── run.py                # Server runner script (Uvicorn)
│   ├── app/
│   │   ├── main.py           # FastAPI app entry point, CORS & routing
│   │   ├── core/             # App settings, environment & security
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic validation schemas
│   │   ├── adapters/         # Mock, Amadeus, and Google Places adapters
│   │   ├── services/         # AI extraction, ranking, itinerary engines
│   │   ├── api/v1/           # REST endpoints (/health, itineraries, etc.)
│   │   └── data/             # Offline JSON mock data
│   └── tests/                # Automated pytest suite
└── frontend/                 # React 18 + Vite + Tailwind CSS Application
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.jsx          # React DOM root
        ├── App.jsx           # Main interactive dashboard & status view
        ├── index.css         # Global styling & Tailwind directives
        ├── components/       # Reusable UI cards, buttons, badges
        ├── layouts/          # Responsive navigation & split-pane layouts
        ├── pages/            # Views (Planner, Itinerary, Saved Trips)
        └── services/         # Axios API client connection
```

---

## 📋 Prerequisites

Before running the application, make sure you have the following installed on your system:

| Tool | Minimum Version | Check Command |
|---|---|---|
| **Python** | `3.10+` (3.13 recommended) | `python --version` |
| **Node.js** | `18.0+` | `node -v` |
| **npm** | `9.0+` | `npm -v` |

---

## 🚀 Step-by-Step Guide: How to Run the Project

### ⚡ One-Click Full-Stack Launch (Windows)

You can launch both the Backend and Frontend with a single command or by double-clicking:

- **Using Batch Launcher (CMD / Explorer)**:
  ```cmd
  run.bat all
  ```
  *(or just double-click `run.bat` for an interactive menu)*

- **Using PowerShell**:
  ```powershell
  .\run.ps1 -Command all
  ```

- **Run Automated Tests**:
  ```cmd
  run.bat test
  ```

---

### Manual Launch: Start Services Individually

To run each service manually in separate terminal windows:

---

### Step 1: Start the Backend (Terminal 1)

1. **Open a terminal** and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. **Create a Python Virtual Environment** (if not already created):
   ```bash
   python -m venv venv
   ```

3. **Activate the Virtual Environment**:
   - **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
     > *Note:* If PowerShell throws an execution policy error, run:  
     > `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` then rerun the activate command.
   - **Windows (Command Prompt / CMD)**:
     ```cmd
     .\venv\Scripts\activate.bat
     ```
   - **macOS / Linux**:
     ```bash
     source venv/bin/activate
     ```

4. **Install Python Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Start the FastAPI Server**:
   ```bash
   python run.py
   ```
   *Alternative:*
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

6. **Verify Backend is Running**:
   - Open your browser or API client:
     - 🩺 **Health Check**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health) (Expected: `{"status":"ok","mock_mode":true}`)
     - 📖 **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
     - 📑 **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### Step 2: Start the Frontend (Terminal 2)

1. **Open a second terminal window** and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. **Install Node Dependencies** (first time only):
   ```bash
   npm install
   ```

3. **Start the Vite Development Server**:
   ```bash
   npm run dev
   ```

4. **Access the Web App**:
   - Open your browser at:
     - 🌐 **Web Interface**: [http://localhost:5173](http://localhost:5173)
   - The frontend will automatically connect to `http://localhost:8000` and display live system telemetry and health status.

---

## ⚙️ Environment Configuration

Both services work out of the box with default mock data (`USE_MOCK_PROVIDERS=true`), meaning **no external API keys are required for local development and testing**.

To customize API credentials, copy `.env.example` to `backend/.env`:

```bash
# In the project root or backend folder
cp .env.example backend/.env
```

Key variables in `backend/.env`:

```ini
APP_ENV=development
USE_MOCK_PROVIDERS=true           # Set to 'false' to use real external APIs
DATABASE_URL=sqlite:///./travelai.db

# AI Engine (Optional for live generation)
GEMINI_API_KEY=your_gemini_api_key_here
LLM_API_KEY=your_openai_api_key_here

# External Travel APIs (Optional for live flight/hotel data)
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
GOOGLE_MAPS_API_KEY=your_google_maps_key

# Network & CORS
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

---

## 🧪 Running Automated Tests

Run backend unit and integration tests using `pytest`:

```bash
cd backend

# Ensure your venv is active
pytest
```

To run with verbose output and coverage:
```bash
pytest -v
```

---

## 🛠️ Troubleshooting & FAQ

<details>
<summary><b>1. PowerShell says: "cannot be loaded because running scripts is disabled on this system"</b></summary>

Windows restricts script execution by default. In PowerShell, allow script execution for the current session:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
```
</details>

<details>
<summary><b>2. Port 8000 or 5173 is already in use</b></summary>

- Check which process is occupying port `8000`:
  - **Windows (PowerShell)**:
    ```powershell
    Get-NetTCPConnection -LocalPort 8000 | Select-Object LocalPort, State, OwningProcess
    ```
  - **macOS / Linux**:
    ```bash
    lsof -i :8000
    ```
- Terminate the conflicting process or change the port in `backend/run.py` and `vite.config.js`.
</details>

<details>
<summary><b>3. Frontend shows "Could not connect to FastAPI server"</b></summary>

- Ensure Terminal 1 is still running `python run.py`.
- Test if backend responds directly in the browser: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health).
- Verify CORS origins in `backend/.env` match `http://localhost:5173`.
</details>

---

## 📄 License & Attribution

Developed as an academic final-year individual project. All rights reserved.
