# Backend Application (Python)

This directory contains the backend API, business logic, database models, and server configuration for the project.

---

## ⚠️ Critical Git & Branching Warnings

Please follow these rules strictly before writing code, opening a pull request, or merging changes.

### 🚫 Do Not Push Directly to `main`
* **Protected Branch:** Direct commits or force-pushes to `main` are strictly prohibited.
* **Branch Workflow:** Always branch off the latest `main` using descriptive names (e.g., `git checkout -b feat/auth-endpoints` or `git checkout -b fix/db-connection`).

### 🔀 Pull Request (PR) Requirements
* **Keep PRs Atomic:** Submit one feature, endpoint, or bugfix per PR. Avoid mixing refactoring with new feature logic.
* **Sync with `main` First:** Always pull the latest `main` into your branch (`git pull origin main`) and resolve all conflicts locally before opening a PR.
* **Tests & Linting Must Pass:** Run your test suite (e.g., `pytest`) and code formatters locally before requesting a review.
* **Document API Changes:** If you add or modify endpoints, request payloads, or response schemas, document them clearly in the PR description.

### 🚨 Merging into `main` Warnings
* **Peer Review Mandatory:** Never self-merge a PR. Every PR requires at least one approval from a team member.
* **Verify Database Migrations:** Ensure any new database migration scripts run cleanly and do not cause destructive data loss before merging.
* **Green CI/CD Checks:** Confirm all automated tests and security checks pass before clicking merge.
* **Squash and Merge:** Always use **Squash and Merge** to maintain a clean commit history on `main`, then delete your feature branch immediately.

---

## 🐍 Python Backend Warnings

* **Never Commit Secrets or `.env`:** Do not commit `.env` files, database credentials, JWT secrets, or API keys. Keep `.env.example` updated instead.
* **Use Virtual Environments:** Never install dependencies globally. Always activate your virtual environment (`venv` or `.venv`) before installing packages or running the server.
* **Keep `requirements.txt` Updated:** Whenever you install a new package, freeze your dependencies (`pip freeze > requirements.txt`) and include the updated file in your PR.
* **Do Not Commit `__pycache__` or `.venv`:** Ensure virtual environments, cache folders (`__pycache__`, `.pytest_cache`), and local SQLite databases are listed in `.gitignore`.
* **Remove Debug Prints:** Replace `print()` debugging statements with proper Python `logging` before submitting a PR.

---

## 🚀 Getting Started

1. **Navigate to the backend folder:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

5. **Run the development server:**
   ```bash
   # Replace with your framework's run command (e.g., FastAPI, Django, or Flask)
   uvicorn main:app --reload
   ```
