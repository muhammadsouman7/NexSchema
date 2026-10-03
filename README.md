# NexSchema

NexSchema is a powerful full-stack application featuring a robust Python/FastAPI (`uvicorn`) backend and a dynamic frontend. Designed for modern web solutions, it integrates advanced database schemas, AI capabilities, and seamless data processing workflows.

## Project Structure

```text
nexschema/
├── backend/         # Python backend (FastAPI / Uvicorn)
├── frontend/        # Frontend application (Node.js)
└── .gitignore       # Git exclusion rules
```

---

## Prerequisites

Before running the project locally, make sure you have the following installed on your machine:
* [Python](https://www.python.org/) (v3.8 or higher)
* [Node.js](https://nodejs.org/) & npm
* A **Groq API Key** (required for AI functionalities)

---

## Getting Started & Running Locally

To run the application locally, you will need to open **two separate terminal windows** in VS Code (one for the backend and one for the frontend).

### 1. Set Up and Run the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   * **Windows:**
     ```bash
     python -m venv venv
     venv\Scripts\activate
     ```
   * **macOS / Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file inside the `backend` folder and add your Groq API key:
   ```env
   GROQ_API_KEY=your_actual_groq_api_key_here
   ```
5. Start the backend server using Uvicorn:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *(The backend will run on `http://127.0.0.1:8000`)*

---

### 2. Set Up and Run the Frontend

1. Open a **second terminal window** in VS Code and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the node modules:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *(The frontend will provide a local URL, typically `http://localhost:5173` or `http://localhost:3000`)*

---

## License
This project is open-source and available under the [MIT License](LICENSE).
