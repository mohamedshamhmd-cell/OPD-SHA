# 🏥 OPD SAATHI — Smart Government Hospital Portal

A full-stack Smart OPD Queue Management and Accessible Navigation system for Government Hospitals.

## Features
- 📋 Patient OPD Registration & Token Generation
- 👨‍⚕️ Doctor Availability & Appointment Booking (8 specialities)
- 🔢 Real-time Queue Tracker with Multilingual TTS Announcements
- 🗺️ Nearby Hospitals Map (OpenStreetMap)
- 🏥 Hospital Floor Map & Wayfinding
- 👨‍💼 Staff Triage Dashboard
- 🌐 8 Indian Languages: English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi

## Tech Stack
- **Frontend:** React + Vite + TailwindCSS + Leaflet.js
- **Backend:** Node.js + Express 5
- **Database:** sql.js (SQLite in-memory, auto-seeded)
- **Speech:** Web Speech API + Google TTS fallback

## Local Development

```bash
# Install root dependencies
npm install

# Install frontend dependencies
npm install --prefix client

# Start backend (port 5000)
npm start

# Start frontend dev server (port 5173) — in a second terminal
npm run dev:client
```

Open http://localhost:5173 in your browser.

## Production Build

```bash
npm run build   # builds the React frontend into client/dist/
npm start       # serves both API and frontend on port 5000
```

## Deployment (Render.com — Free)

1. Push this repo to GitHub
2. Go to https://render.com → New Web Service
3. Connect your GitHub repo
4. Set:
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Node
5. Click **Deploy**

Your live URL will be: `https://opd-saathi.onrender.com`
