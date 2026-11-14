# Frontend Application

This directory contains the frontend source code, components, and assets for the project Terrapredict AI

Critical Git & Branching Warnings

Please read these rules carefully before making changes or opening a pull request.

Do Not Push Directly to `main`
* **Protected Branch:** Direct commits or force-pushes to `main` are strictly prohibited.
* **Branch Workflow:** Always create a new feature or bugfix branch from the latest `main` (e.g., `git checkout -b feat/login-ui` or `git checkout -b fix/navbar-alignment`).

Pull Request (PR) Requirements
* **Keep PRs Focused:** Submit one feature or bugfix per PR. Large, unrelated changes will be rejected.
* **Sync Before Opening a PR:** Always pull and merge the latest `main` into your branch (`git pull origin main`) to resolve merge conflicts locally before requesting a review.
* **No Broken Builds:** Your PR must pass all local build, linting, and test checks before you mark it ready for review.
* **Screenshots Required:** For any UI or styling changes, attach before-and-after screenshots or screen recordings in the PR description.

Merging into `main` Warnings
* **Approval Required:** Never merge your own PR without at least one team member review and approval.
* **Check CI/CD Status:** Ensure all automated checks and build pipelines are green before merging.
* **Use Squash and Merge:** Use **Squash and Merge** to keep the `main` commit history clean and readable.
* **Delete Branch After Merge:** Delete your feature branch immediately after merging to avoid stale branches.

Getting Started

1. **Navigate to the frontend folder:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
