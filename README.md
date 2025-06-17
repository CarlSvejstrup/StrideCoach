# 🏃‍♂️ StrideCoach

**Talk to your runs. Train with insight.**  
StrideCoach is a personal project that combines Strava data, GPS streams, and a conversational AI to help you reflect on your training and improve future performance.

## ✨ Features

- 🔄 Manual Strava import (OAuth2)
- 📊 Activity log with GPS, pace, heart rate
- 💬 Chat with your runs using Gemini Flash / GPT
- 📈 Dynamic feedback & planning suggestions (WIP)
- 🔐 Private-by-default: single-user, no public access

## 🛠️ Tech Stack

- **Next.js 14** – Fullstack app with App Router
- **Prisma + SQLite** – Lightweight local DB (Turso-ready)
- **Gemini 1.5 Flash** – Fast LLM for conversational Q&A
- **Tailwind CSS** – UI components
- **Vercel** – Free-tier hosting (CI-ready)

## 📦 Getting Started

```bash
git clone https://github.com/YOUR_USERNAME/stridecoach.git
cd stridecoach
pnpm install
cp .env.example .env  # fill in your Strava + Gemini keys
pnpm prisma migrate dev
pnpm dev
