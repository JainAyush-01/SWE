# LNMIIT Digi-Doc

> **The LNM Institute of Information Technology, Jaipur (LNMIIT)**

Web application for the **LNMIIT Digi-Doc Institutional Document Routing and Approval System**.
Application state and data persist client-side using browser LocalStorage.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- npm (bundled with Node.js)

### Steps to Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/JainAyush-01/SWE.git
   cd SWE
   ```

2. **Install dependencies:**
   ```bash
   npm --prefix frontend install
   ```

3. **Start the application:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

---

## 👤 Quick Access Roles

The login view provides convenient role profiles to explore all portal capabilities:

- **Student / Submitter**: Browse available forms, create applications, save drafts, and track progress.
- **HOD Approver (CSE)**: Review queue for pending departmental applications (Approve / Reject / Return).
- **Dean Office (Academics)**: Higher-stage approval queue and timeline oversight.
- **Administrator**: Form catalog management, office in-charges, and user directories.

All submitted applications, actions, comments, and form templates are automatically saved to browser LocalStorage and persist across page refreshes.
