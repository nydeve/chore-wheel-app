# QA Test Plan: Chore Wheel & Reward System

**Lead:** QA/Integration Lead (Carla)
**Status:** Initial Draft (Week 1)
**Tech Stack:** FastAPI, Next.js, SQLite, SQLModel

---

## 1. Objectives
To verify that the Chore Wheel App meets all functional requirements (CWR.1 - CWR.13) with a focus on Role-Based Access Control (RBAC) and data integrity for point balances.

## 2. Testing Levels & Responsibilities
* **Unit Testing:** Handled by Developers (Nylah, Portia, Breanna) during feature creation.
* **Integration Testing (QA Lead):** Verifying the flow between FastAPI endpoints and the SQLite database.
* **UI/UX Testing (QA Lead):** Verifying Next.js responsive design (CWR.11.1) and client-side validation (CWR.11.5).

## 3. High-Priority Test Cases (RTM Mapping)

| Test ID | Requirement | Description | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-01** | CWR.1.2 / 1.6 | Login as CHILD; attempt to delete a user. | API returns `403 Forbidden`. |
| **TC-02** | CWR.5.2 / 5.7 | Initiate "Spin" on Chore Wheel. | Random unassigned chore is assigned to the specific child ID. |
| **TC-03** | CWR.6.6 / 8.2 | Parent approves chore for 50 points. | Child balance increases by exactly 50; transaction logged. |
| **TC-04** | CWR.7.9 | Child redeems reward with insufficient points. | "Redeem" button is disabled (UI) and API rejects request. |
| **TC-05** | CWR.12.3 | Call GET `/api/users`. | JSON response contains `username` but NOT `hashed_password`. |

## 4. Bug Tracking Process
Bugs will be tracked via **GitHub Issues**. 
* **Labels:** `bug-critical`, `integration-error`, `ui-fix`.
* **Entry Criteria:** All code must pass the GitHub Actions CI/CD pipeline before being merged into `main`.

## 5. Demo Preparation (CWR.13.4)
* **Script:** Create a "Happy Path" walkthrough (Parent creates chore -> Child spins wheel -> Child completes -> Parent approves -> Reward redeemed).
