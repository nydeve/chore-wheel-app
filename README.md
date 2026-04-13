# Chore Wheel and Reward Tracking App

The Chore Wheel App is a family gamification platform designed to assign and track chores, rewarding children for completion. 

## Project Structure

- **`/frontend`**: The Next.js 14 React application (App Router) built with Tailwind CSS and `shadcn/ui`.
- **`main.py`**: The entry point for the FastAPI Python backend logic and API endpoints.

## Frontend Setup & Execution

Our Next.js frontend is built with a responsive UI targeting mobile, tablet, and desktop views. It contains the complete UI application including Parent authentication views, the Parent management dashboard, the gamified Child dashboard, the Chore Wheel spinner, and the Rewards Store.

### Prerequisites
- Node.js (v18+)
- npm, yarn, or pnpm

### Running Locally
1. Navigate to the frontend directory from the project root:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Access the application in your browser at [http://localhost:3000](http://localhost:3000).

---

## Backend Setup & Execution (FastAPI)

The backend handles database relations using SQLite and SQLModel, providing a structured REST API for our Next.js client to integrate with.

### Prerequisites
- Python 3.9+
- pip

### Running Locally
python3 -m uvicorn main:app --reload

---

*Version 1.0 - Last Updated: March 2026*