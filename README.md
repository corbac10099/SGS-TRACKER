# SGS Tracker — Valorant Companion & Analytics Tracker
*Start Gaming Studio (SGS)*

SGS Tracker is an interactive companion and analytics application for Valorant, designed to help players track their performance, explore agent skill breakdowns with video guides, train their aim, and analyze match data.

---

## Instructions for Riot Games Reviewers

To facilitate the review process without requiring you to create or bind a personal account, a dedicated reviewer account has been set up.

* **Live Demo:** [https://sgs-tracker.vercel.app/](https://sgs-tracker.vercel.app/)
* **Test Credentials:**
  * **Email:** `sgs_riot_temp@gmail.com`
  * **Password:** The verification key value found in `riot.txt`
* **Suggested Test Player:** Search for `Gr4phØ#0001` to test live player analytics and match history features.

> *Note: Logging in with these credentials gives you access to a simulated Valorant user environment with pre-configured data.*

---

## Local Development Setup

This project is built with **Next.js** (App Router). To run the application locally:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Open the app:**
   Navigate to http://localhost:3000 in your browser. You can start editing the main interface in `src/app/page.tsx`.

---

## Tech Stack & Features

- **Framework:** Next.js & React (App Router)
- **Deployment:** Vercel
- **Database & Auth:** PostgreSQL (Neon) & Prisma
- **Desktop Companion:** Tauri v2 with Real-time Game Overlays
- **Aim Trainer:** SGS AIM (Valorant Aim Training by Start Gaming Studio)
- **Audio & Visuals:** Web Audio API synth & Valorant Theme System
