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
- **Gemini 2.5 Flash Light** – Fast LLM for conversational Q&A
- **Tailwind CSS** – UI components
- **Vercel** – Free-tier hosting (CI-ready)

## 📦 Setup & Deployment

1. **Clone & Install**
   ```bash
   git clone https://github.com/CarlSvejstrup/StrideCoach.git
   cd StrideCoach
   pnpm install
   ```

2. **Environment Setup**
   Copy `.env.example` to `.env` and fill in your keys.

3. **Database Initialization**
   ```bash
   pnpm prisma db push
   ```

4. **Run**
   ```bash
   pnpm dev
   ```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub.
2. Connect your repository to [Vercel](https://vercel.com).
3. Add your environment variables from `.env`.
4. **Note**: This template uses SQLite for demonstration. For persistent production data, consider migrating to [Turso](https://turso.tech) or [Neon](https://neon.tech).
