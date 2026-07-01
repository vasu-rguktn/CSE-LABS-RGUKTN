# RGUKT-N CSE Lab Manuals Portal

A static-hosted lab manual digitization portal for the **RGUKT Nuzvid CSE Department**. Faculty upload lab manuals; students browse and download without logging in.

**Live demo:** `https://<your-github-username>.github.io/cse-labs-rguktn/`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Auth | Firebase Authentication (Google OAuth) |
| Database | Firebase Firestore |
| File Storage | Firebase Storage |
| Search | Fuse.js (client-side fuzzy) |
| Routing | React Router v6 (HashRouter) |
| Hosting | GitHub Pages |
| State | Zustand |

---

## Setup Instructions

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Add project**
2. Name it (e.g. `cse-labs-rguktn`)
3. Enable **Google Analytics** (optional)

### 2. Enable Services

#### Authentication
1. Firebase Console → **Authentication** → **Get started**
2. **Sign-in method** → Enable **Google**
3. Add your GitHub Pages URL to **Authorized domains**:  
   `https://<your-github-username>.github.io`

#### Firestore
1. **Firestore Database** → **Create database**
2. Choose **Production mode** (rules will be deployed separately)
3. Pick a region close to India (e.g. `asia-south1`)

#### Storage
1. **Storage** → **Get started** → Production mode
2. Same region as Firestore

### 3. Get Firebase Config

1. Firebase Console → **Project Settings** → **General**
2. Under **Your apps**, click **</>** (Web app) → Register
3. Copy the config object values

### 4. Configure Local Environment

```bash
cp .env.example .env
```

Fill in `.env` with your Firebase values:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 5. Deploy Firebase Security Rules

Install Firebase CLI and deploy rules:

```bash
npm install -g firebase-tools
firebase login
firebase use --add    # select your project
firebase deploy --only firestore:rules,storage
```

### 6. Set GitHub Repository Secrets

In your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**, add all six:

| Secret Name | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | Your API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `your-project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
| `VITE_FIREBASE_APP_ID` | App ID |

### 7. Configure GitHub Pages

1. GitHub repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `gh-pages` / `/ (root)`

Push to `main` → GitHub Actions builds and deploys automatically.

### 8. Update Vite Base Path

In `vite.config.ts`, make sure `base` matches your repo name:

```ts
base: '/cse-labs-rguktn/',  // change to your actual repo name
```

---

## Local Development

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`

## Build & Preview

```bash
npm run build
npm run preview
```

---

## Project Structure

```
src/
  data/subjects.ts          — Static subjects array
  firebase/
    config.ts               — Firebase SDK init
    auth.ts                 — Google sign-in + domain check
    firestore.ts            — Firestore CRUD helpers
    storage.ts              — PDF upload helpers
  store/authStore.ts        — Zustand global auth state
  components/
    SearchBar.tsx           — Fuzzy search with autocomplete
    SubjectDropdown.tsx     — Fallback subject picker
    SubjectCard.tsx         — Clickable subject grid card
    PdfViewer.tsx           — Embedded PDF iframe viewer
    Navbar.tsx              — Responsive navigation bar
    ProtectedFacultyRoute   — Auth guard HOC
  pages/
    Landing.tsx             — Hero + search + subject grid
    SubjectPage.tsx         — PDF preview + download
    FacultyLogin.tsx        — Google sign-in page
    FacultySelectSubject    — One-time subject selection
    FacultyDashboard.tsx    — Upload + manage manual
  App.tsx                   — HashRouter + routes
  main.tsx                  — App entry point
  index.css                 — Global styles + Tailwind
firestore.rules             — Firestore security rules
storage.rules               — Storage security rules
firebase.json               — Firebase CLI config
.env.example                — Env var template
.github/workflows/deploy.yml — GitHub Actions CI/CD
```

---

## Faculty Usage

1. Visit the portal and click **Faculty Login**
2. Sign in with your `@rguktn.ac.in` Google account
3. On first login, **select your subject** (one-time, permanent)
4. On your **Dashboard**, upload a PDF lab manual (max 20MB)
5. Students can immediately view and download it

## Student Usage

1. Visit the portal
2. Search by subject name, short name, or course code
3. Select a subject card to view the embedded PDF
4. Click **Download PDF** to save it

---

## Security Model

- Only `@rguktn.ac.in` Google accounts can sign in as faculty
- Each faculty is locked to **one subject** via Firestore (no client-side update)
- Only the faculty assigned to a subject can upload its manual
- Students can read all lab manuals without authentication
- Firebase Storage enforces PDF-only, 20MB max at the rule level

---

*Built with ❤️ for RGUKT Nuzvid CSE Department*
