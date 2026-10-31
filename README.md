# 🏥 OPD SHA — Smart Government Hospital Portal

A full-stack Smart OPD Queue Management, Patient Sorting, and Accessible Navigation system for Government Hospitals.

## ✨ Features
- 📋 **Patient OPD Registration & Token Generation** (Instant walk-in and scheduled time slots)
- 👨‍⚕️ **Doctor Availability & Appointment Booking** (Detailed roster across 8 clinical specialities)
- 🔄 **Patient Sorting & Prioritization Console (New)**
  - Automated prioritization: Emergency cases always highest priority (Red indicator)
  - Senior citizens (60+) receive higher elderly priority
  - Combined weighted algorithm + FIFO waiting time tie-breaker
  - Nurse & Caretaker escort assignment workflow
  - Automatic multilingual nurse escort voice announcements with room numbers
- 🌐 **Multilingual & Full RTL Arabic Support**
  - Languages: Arabic (العربية), English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi
  - Right-to-Left (RTL) layout switching for Arabic
  - Native Web Speech API synthesis with authentic Arabic and English voices
- 🔢 **Real-time Queue Tracker with Multilingual Announcements**
- 🗺️ **Nearby Hospitals Map & Bed Availability**
- 🏥 **Hospital Interactive Floor Map & Wayfinding**
- 👨‍💼 **Staff & Triage Operations Dashboard**

## 🛠️ Tech Stack
- **Frontend:** React 18 + Vite + TailwindCSS 4 + Lucide Icons + Leaflet.js
- **Backend:** Node.js + Express 5
- **Database:** sql.js (SQLite persistent/in-memory, auto-seeded)
- **Speech Engine:** Web Speech API (`speechSynthesis`) + Arabic voice detection + Google TTS fallback

## 🚀 Local Development

```bash
# 1. Install root & client dependencies
npm install
npm install --prefix client

# 2. Start backend server (port 5000)
npm start

# 3. In a second terminal, launch Vite dev server (port 5173)
npm run dev:client
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📦 Production Build

```bash
npm run build   # builds React frontend into client/dist/
npm start       # serves API and frontend on port 5000
```
